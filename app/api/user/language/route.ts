import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const languageSchema = z.object({
  language: z.enum(['en', 'ru']),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = languageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: { language: parsed.data.language },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Language update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


