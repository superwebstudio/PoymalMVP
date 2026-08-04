import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSupabaseAuthClient,
  getSafeRedirect,
  setSessionCookies,
  upsertAppUser,
} from '@/lib/supabase-auth-server';
import { AUTH_LIMIT, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const verifyCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6,8}$/),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  next: z.string().optional(),
  referralCode: z.string().trim().max(32).nullable().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = verifyCodeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter the code from your email' }, { status: 400 });
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateLimit = checkRateLimit(`${clientIp}:${parsed.data.email}:verify`, AUTH_LIMIT);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const supabase = createSupabaseAuthClient();
    const otpPayload = {
      email: parsed.data.email,
      token: parsed.data.code,
    } as const;

    // Existing users usually need type "email"; first-time / unconfirmed need "signup".
    let result = await supabase.auth.verifyOtp({ ...otpPayload, type: 'email' });
    if (result.error || !result.data.session || !result.data.user) {
      result = await supabase.auth.verifyOtp({ ...otpPayload, type: 'signup' });
    }

    if (result.error || !result.data.session || !result.data.user) {
      return NextResponse.json({ error: 'That code is invalid or has expired' }, { status: 401 });
    }

    const { user, isNewUser } = await upsertAppUser(result.data.user, parsed.data.referralCode);
    const requestedRedirect = getSafeRedirect(parsed.data.next);
    const redirectTo = isNewUser ? '/language-select' : requestedRedirect;
    const response = NextResponse.json({
      success: true,
      isNewUser,
      redirectTo,
      user: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        photoUrl: user.photoUrl,
        isPro: user.isPro,
        language: user.language,
      },
    });
    setSessionCookies(response, result.data.session);

    return response;
  } catch (error: unknown) {
    console.error('Email code verification failed:', error);
    return NextResponse.json({ error: 'Unable to complete sign-in' }, { status: 500 });
  }
}
