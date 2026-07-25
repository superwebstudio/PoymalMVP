import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Expire pending referrals (called by cron job or manually)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if you want to secure this endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Optional: Add security for production
    // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const now = new Date();

    // Find and update expired referrals
    const result = await prisma.referral.updateMany({
      where: {
        status: 'pending',
        firstPostAt: null,
        expiresAt: { lt: now },
      },
      data: {
        status: 'expired',
      },
    });

    return NextResponse.json({
      success: true,
      expiredCount: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Expire referrals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

