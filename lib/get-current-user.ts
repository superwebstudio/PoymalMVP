import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { ACCESS_TOKEN_COOKIE, getAuthUser } from '@/lib/supabase-auth-server';

/**
 * Lean current-user fetch for auth gates and page hydration.
 * Does not include catch history — use getUserProfile for that.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return null;
    }

    const authUser = await getAuthUser(accessToken);
    if (!authUser) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { authId: authUser.id },
      select: {
        id: true,
        authId: true,
        email: true,
        firstName: true,
        username: true,
        photoUrl: true,
        language: true,
        isPro: true,
        isAdmin: true,
        country: true,
        proType: true,
        proExpiresAt: true,
        notificationsEnabled: true,
        notifyOnLikes: true,
        notifyOnComments: true,
        showCountryBadge: true,
        catchViewMode: true,
      },
    });

    if (!user) {
      return null;
    }

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    return {
      ...user,
      _count: {
        followers: followersCount,
        following: followingCount,
      },
    };
  } catch (error: unknown) {
    console.error('Error getting current user:', error);
    return null;
  }
}
