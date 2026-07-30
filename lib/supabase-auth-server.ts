import { randomUUID } from 'crypto';
import { createClient, type Session, type User as SupabaseUser } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const ACCESS_TOKEN_COOKIE = 'poymal-access-token';
export const REFRESH_TOKEN_COOKIE = 'poymal-refresh-token';
export const AUTH_NEXT_COOKIE = 'poymal-auth-next';
export const AUTH_REFERRAL_COOKIE = 'poymal-auth-referral';

export interface AuthStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

interface AppUserResult {
  user: Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>;
  isNewUser: boolean;
}

function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase authentication is not configured');
  }

  return { url, anonKey };
}

export function createSupabaseAuthClient(storage?: AuthStorage) {
  const { url, anonKey } = getSupabaseConfig();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: Boolean(storage),
      storage,
    },
  });
}

export function getSafeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return fallback;
  }

  return value;
}

function getMetadataString(user: SupabaseUser, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = user.user_metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function generateReferralCode(): string {
  return `FISH-${randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase()}`;
}

async function createUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateReferralCode();
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique referral code');
}

async function processReferral(userId: string, referralCode?: string | null): Promise<void> {
  if (!referralCode?.startsWith('FISH-')) {
    return;
  }

  const referrer = await prisma.user.findUnique({
    where: { referralCode },
    select: { id: true },
  });

  if (!referrer || referrer.id === userId) {
    return;
  }

  const existingReferral = await prisma.referral.findUnique({
    where: { referredUserId: userId },
    select: { id: true },
  });

  if (existingReferral) {
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.referral.create({
    data: {
      referrerUserId: referrer.id,
      referredUserId: userId,
      status: 'pending',
      expiresAt,
    },
  });
}

export async function upsertAppUser(
  authUser: SupabaseUser,
  referralCode?: string | null,
): Promise<AppUserResult> {
  const email = authUser.email?.trim().toLowerCase() ?? null;
  const firstName =
    getMetadataString(authUser, 'given_name', 'full_name', 'name') ??
    email?.split('@')[0] ??
    null;
  const photoUrl = getMetadataString(authUser, 'avatar_url', 'picture');

  const existingUser = await prisma.user.findUnique({
    where: { authId: authUser.id },
  });

  if (existingUser) {
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email,
        firstName: existingUser.firstName ?? firstName,
        photoUrl: existingUser.photoUrl ?? photoUrl,
      },
    });

    return { user, isNewUser: !user.username };
  }

  const user = await prisma.user.create({
    data: {
      authId: authUser.id,
      email,
      firstName,
      username: null,
      photoUrl,
      referralCode: await createUniqueReferralCode(),
    },
  });

  await processReferral(user.id, referralCode);

  return { user, isNewUser: true };
}

export async function getAuthUser(accessToken: string): Promise<SupabaseUser | null> {
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export function setSessionCookies(response: NextResponse, session: Session): void {
  const secure = process.env.NODE_ENV === 'production';
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 60 * 60;
  const accessMaxAge = Math.max(60, expiresAt - Math.floor(Date.now() / 1000));

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    maxAge: accessMaxAge,
    path: '/',
    sameSite: 'lax',
    secure,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
}
