import { NextRequest, NextResponse } from 'next/server';
import { getRelatedCatches } from '../../_service';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const createdAt = searchParams.get('createdAt');
        const location = searchParams.get('location');

        if (!userId || !createdAt) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const relatedCatches = await getRelatedCatches(id, userId, createdAt, location);
        return NextResponse.json(relatedCatches);
    } catch (error) {
        console.error('Error fetching related catches:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}




