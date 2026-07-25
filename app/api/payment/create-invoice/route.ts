import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const dynamic = 'force-dynamic';

// POST - Create Telegram Stars invoice
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { userId } = auth;
        const body = await request.json();

        const { plan, amount } = body;

        if (!plan || !amount) {
            return NextResponse.json({ error: 'Plan and amount are required' }, { status: 400 });
        }

        if (plan !== 'monthly') {
            return NextResponse.json({ error: 'Only monthly plan is supported' }, { status: 400 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                amount,
                currency: 'stars',
                type: plan,
                status: 'pending',
            },
        });

        // Create invoice via Telegram Bot API
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        // Create invoice link using Telegram Bot API createInvoiceLink method
        const planName = 'Monthly PRO';
        const planDescription = 'Unlimited AI identification, ad-free experience, PRO badge';

        try {
            const botApiUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;
            const invoiceResponse = await fetch(botApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: planName,
                    description: planDescription,
                    payload: JSON.stringify({ transactionId: transaction.id, userId, plan }),
                    provider_token: '', // Not needed for Stars
                    currency: 'XTR', // Telegram Stars currency code
                    prices: [{
                        label: planName,
                        amount: amount * 100, // Amount in smallest currency unit (1 star = 100)
                    }],
                }),
            });

            if (!invoiceResponse.ok) {
                const errorData = await invoiceResponse.json();
                console.error('Telegram API error:', errorData);
                throw new Error('Failed to create invoice');
            }

            const invoiceData = await invoiceResponse.json();
            
            return NextResponse.json({
                invoiceId: transaction.id,
                invoiceUrl: invoiceData.result, // The invoice link
            });
        } catch (error) {
            console.error('Invoice creation error:', error);
            // Fallback: return a link that can be used to send invoice via bot
            return NextResponse.json({
                invoiceId: transaction.id,
                invoiceUrl: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'your_bot'}?start=pay_${transaction.id}`,
            });
        }
    } catch (error) {
        console.error('Create invoice error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
