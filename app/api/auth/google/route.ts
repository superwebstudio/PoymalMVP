import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_NEXT_COOKIE,
  AUTH_REFERRAL_COOKIE,
  createSupabaseAuthClient,
  getSafeRedirect,
  type AuthStorage,
} from '@/lib/supabase-auth-server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const pendingCookies = new Map<string, string>();
    const storage: AuthStorage = {
      getItem: (key) => request.cookies.get(key)?.value ?? null,
      setItem: (key, value) => {
        pendingCookies.set(key, value);
      },
      removeItem: (key) => {
        pendingCookies.delete(key);
      },
    };
    const supabase = createSupabaseAuthClient(storage);
    const callbackUrl = new URL('/api/auth/callback', request.nextUrl.origin).toString();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      console.error('Unable to start Google authentication:', error?.message);
      return NextResponse.redirect(new URL('/login?error=google', request.nextUrl.origin));
    }

    const response = NextResponse.redirect(data.url);
    const secure = process.env.NODE_ENV === 'production';
    for (const [key, value] of pendingCookies) {
      response.cookies.set(key, value, {
        httpOnly: true,
        maxAge: 60 * 10,
        path: '/',
        sameSite: 'lax',
        secure,
      });
    }

    response.cookies.set(
      AUTH_NEXT_COOKIE,
      getSafeRedirect(request.nextUrl.searchParams.get('next')),
      {
        httpOnly: true,
        maxAge: 60 * 10,
        path: '/',
        sameSite: 'lax',
        secure,
      },
    );

    const referralCode = request.nextUrl.searchParams.get('referralCode');
    if (referralCode?.startsWith('FISH-')) {
      response.cookies.set(AUTH_REFERRAL_COOKIE, referralCode.slice(0, 32), {
        httpOnly: true,
        maxAge: 60 * 10,
        path: '/',
        sameSite: 'lax',
        secure,
      });
    }

    return response;
  } catch (error: unknown) {
    console.error('Google authentication failed to start:', error);
    return NextResponse.redirect(new URL('/login?error=configuration', request.nextUrl.origin));
  }
}
