import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { AUTH_LIMIT, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const requestCodeSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = requestCodeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateLimit = checkRateLimit(`${clientIp}:${parsed.data.email}`, AUTH_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const supabase = createSupabaseAuthClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('Unable to send authentication code:', error.message);
      return NextResponse.json({ error: 'Unable to send a sign-in code' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Email authentication request failed:', error);
    return NextResponse.json({ error: 'Unable to send a sign-in code' }, { status: 500 });
  }
}
