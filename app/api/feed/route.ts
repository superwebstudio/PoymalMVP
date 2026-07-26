import { NextRequest, NextResponse } from 'next/server';
import { getFeed } from './_service';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        const userId = auth.success ? auth.userId : undefined;
        const { searchParams } = new URL(request.url);
        const feedType = (searchParams.get('type') || 'all') as 'all' | 'following';

        const feed = await getFeed(userId, feedType);
        return NextResponse.json(Array.isArray(feed) ? feed : []);
    } catch (error) {
        console.error('Feed error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
