import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Check if post is saved
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const { searchParams } = new URL(request.url);
    const catchId = searchParams.get('catchId');

    if (!catchId) {
      return NextResponse.json({ error: 'Catch ID is required' }, { status: 400 });
    }

    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_catchId: {
          userId,
          catchId,
        },
      },
    });

    return NextResponse.json({ isSaved: !!savedPost });
  } catch (error) {
    console.error('Check saved post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Save a post
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const body = await request.json();
    const { catchId } = body;

    if (!catchId) {
      return NextResponse.json({ error: 'Catch ID is required' }, { status: 400 });
    }

    // Check if already saved
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_catchId: {
          userId,
          catchId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Post already saved' }, { status: 409 });
    }

    // Create saved post
    const savedPost = await prisma.savedPost.create({
      data: {
        userId,
        catchId,
      },
    });

    return NextResponse.json({ success: true, savedPost });
  } catch (error) {
    console.error('Save post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Unsave a post
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const { searchParams } = new URL(request.url);
    const catchId = searchParams.get('catchId');

    if (!catchId) {
      return NextResponse.json({ error: 'Catch ID is required' }, { status: 400 });
    }

    await prisma.savedPost.delete({
      where: {
        userId_catchId: {
          userId,
          catchId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsave post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

