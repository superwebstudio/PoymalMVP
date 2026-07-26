import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  createSupabaseAuthClient,
  getAuthUser,
  setSessionCookies,
  upsertAppUser,
} from '@/lib/supabase-auth-server';

async function handleSession(request: NextRequest): Promise<NextResponse> {
  try {
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    let authUser = accessToken ? await getAuthUser(accessToken) : null;
    let refreshedSession = null;

    if (!authUser && refreshToken) {
      const supabase = createSupabaseAuthClient();
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!error && data.session && data.user) {
        authUser = data.user;
        refreshedSession = data.session;
      }
    }

    if (!authUser) {
      return NextResponse.json({ authenticated: false });
    }

    const { user } = await upsertAppUser(authUser);
    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        photoUrl: user.photoUrl,
        isPro: user.isPro,
        language: user.language,
        proType: user.proType,
        country: user.country,
      },
    });

    if (refreshedSession) {
      setSessionCookies(response, refreshedSession);
    }

    return response;
  } catch (error: unknown) {
    console.error('Session check failed:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSession(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSession(request);
}
