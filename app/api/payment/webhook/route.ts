import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const dynamic = 'force-dynamic';

// POST - Handle Telegram payment webhook
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Telegram sends pre_checkout_query or successful_payment updates
        if (body.pre_checkout_query) {
            const query = body.pre_checkout_query;
            const payload = JSON.parse(query.invoice_payload);
            
            // Verify transaction exists
            const transaction = await prisma.transaction.findUnique({
                where: { id: payload.transactionId },
            });

            if (!transaction) {
                return NextResponse.json({ ok: false, error: 'Transaction not found' });
            }

            // Answer pre-checkout query (approve)
            return NextResponse.json({ ok: true });
        }

        if (body.message?.successful_payment) {
            const payment = body.message.successful_payment;
            const payload = JSON.parse(payment.invoice_payload);
            
            // Find transaction
            const transaction = await prisma.transaction.findUnique({
                where: { id: payload.transactionId },
            });

            if (!transaction || transaction.status === 'completed') {
                return NextResponse.json({ ok: true });
            }

            // Calculate expiration date (monthly only)
            const now = new Date();
            const expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + 1);

            // Update user to PRO
            await prisma.user.update({
                where: { id: payload.userId },
                data: {
                    isPro: true,
                    proType: payload.plan,
                    proExpiresAt: expirationDate,
                },
            });

            // Update transaction status
            await prisma.transaction.update({
                where: { id: payload.transactionId },
                data: {
                    status: 'completed',
                },
            });

            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

