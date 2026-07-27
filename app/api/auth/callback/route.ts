import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_NEXT_COOKIE,
  AUTH_REFERRAL_COOKIE,
  createSupabaseAuthClient,
  getSafeRedirect,
  setSessionCookies,
  upsertAppUser,
  type AuthStorage,
} from '@/lib/supabase-auth-server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=callback', request.nextUrl.origin));
  }

  try {
    const removedStorageKeys = new Set<string>();
    const storage: AuthStorage = {
      getItem: (key) => request.cookies.get(key)?.value ?? null,
      setItem: () => undefined,
      removeItem: (key) => {
        removedStorageKeys.add(key);
      },
    };
    const supabase = createSupabaseAuthClient(storage);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session || !data.user) {
      console.error('Google authentication callback failed:', error?.message);
      return NextResponse.redirect(new URL('/login?error=callback', request.nextUrl.origin));
    }

    const referralCode = request.cookies.get(AUTH_REFERRAL_COOKIE)?.value ?? null;
    const { isNewUser } = await upsertAppUser(data.user, referralCode);
    const requestedRedirect = getSafeRedirect(request.cookies.get(AUTH_NEXT_COOKIE)?.value);
    const redirectTo = isNewUser ? '/language-select' : requestedRedirect;
    const response = NextResponse.redirect(new URL(redirectTo, request.nextUrl.origin));

    setSessionCookies(response, data.session);
    response.cookies.set(AUTH_NEXT_COOKIE, '', { maxAge: 0, path: '/' });
    response.cookies.set(AUTH_REFERRAL_COOKIE, '', { maxAge: 0, path: '/' });
    for (const key of removedStorageKeys) {
      response.cookies.set(key, '', { maxAge: 0, path: '/' });
    }

    return response;
  } catch (error: unknown) {
    console.error('Google authentication callback failed:', error);
    return NextResponse.redirect(new URL('/login?error=callback', request.nextUrl.origin));
  }
}
