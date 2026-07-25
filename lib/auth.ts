import { NextRequest, NextResponse } from 'next/server';
import prisma from './prisma';
import { ACCESS_TOKEN_COOKIE, getAuthUser } from './supabase-auth-server';

/**
 * Authentication result - success case
 */
export interface AuthSuccess {
    success: true;
    userId: string;
    authId: string;
}

/**
 * Authentication result - failure case
 */
export interface AuthFailure {
    success: false;
    error: string;
    status: number;
}

/**
 * Authentication result union type
 */
export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Cache for Supabase identity lookups to reduce DB queries.
 */
const userCache = new Map<string, { userId: string; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Verify the HttpOnly Supabase session attached to a request.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
    try {
        const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
        if (!accessToken) {
            return { success: false, error: 'Authentication required', status: 401 };
        }

        const authUser = await getAuthUser(accessToken);
        if (!authUser) {
            return { success: false, error: 'Authentication expired', status: 401 };
        }

        const cached = userCache.get(authUser.id);
        if (cached && cached.expires > Date.now()) {
            return { success: true, userId: cached.userId, authId: authUser.id };
        }

        const user = await prisma.user.findUnique({
            where: { authId: authUser.id },
            select: { id: true },
        });

        if (!user) {
            return { success: false, error: 'User not found', status: 401 };
        }

        userCache.set(authUser.id, {
            userId: user.id,
            expires: Date.now() + CACHE_TTL,
        });

        return { success: true, userId: user.id, authId: authUser.id };
    } catch (error: unknown) {
        console.error('Authentication verification failed:', error);
        return { success: false, error: 'Server configuration error', status: 500 };
    }
}

export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
    const auth = await verifyAuth(request);
    if (!auth.success) {
        return auth;
    }

    const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
        return { success: false, error: 'Forbidden', status: 403 };
    }

    return auth;
}

/**
 * Helper to create an unauthorized response
 */
export function unauthorizedResponse(error: string = 'Unauthorized'): NextResponse {
    return NextResponse.json({ error }, { status: 401 });
}

/**
 * Helper to create a forbidden response
 */
export function forbiddenResponse(error: string = 'Forbidden'): NextResponse {
    return NextResponse.json({ error }, { status: 403 });
}

/**
 * Resource ownership verification result
 */
export type OwnershipResult = AuthFailure | (AuthSuccess & { isOwner: boolean });

/**
 * Verify that the authenticated user owns a resource
 */
export async function verifyResourceOwnership(
    request: NextRequest,
    resourceUserId: string
): Promise<OwnershipResult> {
    const auth = await verifyAuth(request);

    if (!auth.success) {
        return auth;
    }

    return {
        ...auth,
        isOwner: auth.userId === resourceUserId,
    };
}

/**
 * Clear a Supabase identity from the lookup cache.
 */
export function clearUserCache(authId: string): void {
    userCache.delete(authId);
}

