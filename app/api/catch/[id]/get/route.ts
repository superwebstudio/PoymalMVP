import { NextRequest, NextResponse } from 'next/server';
import { getCatch } from '../../_service';

export const dynamic = 'force-dynamic';

// GET - Get a single catch
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const catchData = await getCatch(id);

        if (!catchData) {
            return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
        }

        return NextResponse.json(catchData);
    } catch (error) {
        console.error('Get catch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

