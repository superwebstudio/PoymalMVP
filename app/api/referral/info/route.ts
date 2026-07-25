import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get referrer info by referral code
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
        }

        // Find user by referral code
        const referrer = await prisma.user.findUnique({
            where: { referralCode: code },
            select: {
                firstName: true,
                username: true,
            },
        });

        if (!referrer) {
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
        }

        return NextResponse.json({
            referrerName: referrer.firstName || referrer.username || 'Friend',
        });
    } catch (error) {
        console.error('Get referral info error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

