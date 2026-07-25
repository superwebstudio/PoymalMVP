import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const dynamic = 'force-dynamic';

// POST - Verify payment and activate PRO
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { userId } = auth;
        const body = await request.json();

        const { invoiceId, plan } = body;

        if (!invoiceId || !plan) {
            return NextResponse.json({ error: 'Invoice ID and plan are required' }, { status: 400 });
        }

        if (plan !== 'monthly') {
            return NextResponse.json({ error: 'Only monthly plan is supported' }, { status: 400 });
        }

        // Get transaction
        const transaction = await prisma.transaction.findUnique({
            where: { id: invoiceId },
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        if (transaction.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Calculate expiration date
        const now = new Date();
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);

        // Update user to PRO
        await prisma.user.update({
            where: { id: userId },
            data: {
                isPro: true,
                proType: plan,
                proExpiresAt: expirationDate,
            },
        });

        // Update transaction status
        await prisma.transaction.update({
            where: { id: invoiceId },
            data: {
                status: 'completed',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Verify payment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

