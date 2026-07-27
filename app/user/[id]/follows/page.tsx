'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { CachedImage } from '@/components/CachedImage';
import { FollowButton } from '@/components/FollowButton';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { cn } from '@/lib/utils';

type FollowType = 'followers' | 'following';

type FollowUser = {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  isPro: boolean;
  isFollowing: boolean;
};

function FollowsPageContent(): React.JSX.Element {
  const { dict } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const userId = params.id;
  const { userId: currentUserId, followingCount, setFollowingCount } =
    useUserStore();

  const typeParam = searchParams.get('type');
  const activeType: FollowType =
    typeParam === 'following' ? 'following' : 'followers';

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(
    async (cursor: string | null, append: boolean): Promise<void> => {
      if (!userId) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const query = new URLSearchParams({
          type: activeType,
          take: '40',
        });
        if (cursor) {
          query.set('cursor', cursor);
        }

        const response = await fetch(
          `/api/user/${userId}/follows?${query.toString()}`,
          { credentials: 'include' },
        );

        if (!response.ok) {
          throw new Error('Failed to load');
        }

        const data = (await response.json()) as {
          users: FollowUser[];
          nextCursor: string | null;
        };

        setUsers((prev) =>
          append ? [...prev, ...(data.users || [])] : data.users || [],
        );
        setNextCursor(data.nextCursor ?? null);
      } catch (err) {
        console.error(err);
        setError('Unable to load connections');
        if (!append) {
          setUsers([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeType, userId],
  );

  useEffect(() => {
    void fetchList(null, false);
  }, [fetchList]);

  const setTab = (type: FollowType): void => {
    router.replace(`/user/${userId}/follows?type=${type}`, { scroll: false });
  };

  const handleFollowChange = (targetId: string, next: boolean): void => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === targetId ? { ...user, isFollowing: next } : user,
      ),
    );
    setFollowingCount(Math.max(0, followingCount + (next ? 1 : -1)));
  };

  const fallbackUrl =
    currentUserId === userId ? '/profile' : `/user/${userId}`;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-[80px] text-zinc-100">
      <TelegramBackButton fallbackUrl={fallbackUrl} />
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-zinc-200"
            aria-label="Back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-zinc-100">
            {activeType === 'followers' ? dict.followers : dict.following}
          </h1>
        </div>
        <div className="flex border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setTab('followers')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors',
              activeType === 'followers'
                ? 'border-b-2 border-sky-500 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {dict.followers}
          </button>
          <button
            type="button"
            onClick={() => setTab('following')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors',
              activeType === 'following'
                ? 'border-b-2 border-sky-500 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {dict.following}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        {isLoading && (
          <div className="py-10 text-center text-zinc-500">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
            {dict.loading}
          </div>
        )}

        {error && !isLoading && (
          <div className="py-10 text-center text-zinc-500">{error}</div>
        )}

        {!isLoading && !error && users.length === 0 && (
          <div className="py-10 text-center text-zinc-500">
            {activeType === 'followers'
              ? dict.noFollowers || 'No followers yet'
              : dict.noFollowing || 'Not following anyone yet'}
          </div>
        )}

        {!isLoading && users.length > 0 && (
          <div className="space-y-2">
            {users.map((user) => {
              const displayName =
                user.firstName || user.username || dict.angler;
              const initial = displayName.charAt(0).toUpperCase();
              const isSelf = currentUserId === user.id;

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
                >
                  <Link
                    href={isSelf ? '/profile' : `/user/${user.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                      {user.photoUrl ? (
                        <CachedImage
                          src={user.photoUrl}
                          alt={displayName}
                          className="h-full w-full"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 truncate font-semibold text-zinc-200">
                        <span className="truncate">{displayName}</span>
                        {user.isPro && (
                          <span className="rounded border border-yellow-500/30 bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                            PRO
                          </span>
                        )}
                      </div>
                      {user.username && (
                        <div className="text-sm text-zinc-500">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </Link>
                  {currentUserId && !isSelf && (
                    <FollowButton
                      userId={user.id}
                      currentUserId={currentUserId}
                      isFollowing={user.isFollowing}
                      compact
                      onFollowChange={(next) =>
                        handleFollowChange(user.id, next)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {nextCursor && !isLoading && (
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => void fetchList(nextCursor, true)}
            className="mt-4 w-full rounded-lg bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
          >
            {isLoadingMore ? dict.loading : dict.loadMore || 'Load more'}
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function FollowsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          Loading...
        </div>
      }
    >
      <FollowsPageContent />
    </Suspense>
  );
}
