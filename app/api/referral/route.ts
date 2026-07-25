import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Generate a FISH-XXXXXX referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FISH-${code}`;
}

// GET - Get user's referral data
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;

    // Get user with referral data
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        premiumDaysBalance: true,
        totalCompletedReferrals: true,
        raffleTickets: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate referral code if not exists (migration for existing users)
    if (!user.referralCode || !user.referralCode.startsWith('FISH-')) {
      const newCode = generateReferralCode();
      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: newCode },
        select: {
          id: true,
          referralCode: true,
          premiumDaysBalance: true,
          totalCompletedReferrals: true,
          raffleTickets: true,
        },
      });
    }

    // Get referral stats
    const referrals = await prisma.referral.findMany({
      where: { referrerUserId: userId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        firstPostAt: true,
        daysAwarded: true,
        referred: {
          select: {
            firstName: true,
            username: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const completed = referrals.filter(r => r.status === 'completed');
    const pending = referrals.filter(r => r.status === 'pending');
    const expired = referrals.filter(r => r.status === 'expired');
    const totalDaysEarned = completed.reduce((sum, r) => sum + r.daysAwarded, 0);

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/join/${user.referralCode}`,
      premiumDaysBalance: user.premiumDaysBalance,
      totalCompletedReferrals: user.totalCompletedReferrals,
      raffleTickets: user.raffleTickets,
      totalDaysEarned,
      stats: {
        completed: completed.length,
        pending: pending.length,
        expired: expired.length,
      },
      referrals: referrals.map(r => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        firstPostAt: r.firstPostAt,
        daysAwarded: r.daysAwarded,
        user: r.referred,
      })),
    });
  } catch (error) {
    console.error('Get referral data error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Register a referral (when new user signs up with referral code)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { referralCode } = body;
    const referredUserId = auth.userId;

    if (!referralCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the referrer by code
    const referrer = await prisma.user.findFirst({
      where: { referralCode },
    });

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Can't refer yourself
    if (referrer.id === referredUserId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if user was already referred
    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId },
    });

    if (existingReferral) {
      return NextResponse.json({ error: 'User already has a referral' }, { status: 409 });
    }

    // Create referral record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const referral = await prisma.referral.create({
      data: {
        referrerUserId: referrer.id,
        referredUserId,
        status: 'pending',
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      referral,
      referrerName: referrer.firstName || referrer.username || 'A friend',
      message: 'Post your first catch within 7 days to earn 7 days free Premium!',
    });
  } catch (error) {
    console.error('Create referral error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

