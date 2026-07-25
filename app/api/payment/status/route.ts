import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const dynamic = 'force-dynamic';

// GET - Check payment status
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { userId } = auth;
        const transactionId = request.nextUrl.searchParams.get('transactionId');

        if (!transactionId) {
            return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        if (transaction.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            status: transaction.status,
            transactionId: transaction.id,
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

