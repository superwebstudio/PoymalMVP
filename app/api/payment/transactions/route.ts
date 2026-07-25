import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List current user's PRO payment transactions
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        currency: true,
        type: true,
        status: true,
        invoiceUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        status: tx.status,
        invoiceUrl: tx.invoiceUrl,
        date: tx.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('List transactions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
