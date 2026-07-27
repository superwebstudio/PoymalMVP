'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Fish, Search as SearchIcon, Users, Wheat, X } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { CachedImage } from '@/components/CachedImage';
import { FollowButton } from '@/components/FollowButton';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { cn } from '@/lib/utils';

type SearchFilter = 'all' | 'people' | 'catches' | 'baits';

type SearchUser = {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  isPro: boolean;
  isFollowing: boolean;
  _count: {
    catches: number;
    followers: number;
  };
};

type SearchCatch = {
  id: string;
  species: string | null;
  description: string | null;
  imageUrl: string | null;
  location: string | null;
  weight: number | null;
  bait: string | null;
  method: string | null;
  postType: string | null;
  baitMixData: {
    mixName?: string;
  } | null;
  user: {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    isPro: boolean;
  };
};

type SearchResponse = {
  people: SearchUser[];
  catches: SearchCatch[];
  baits: SearchCatch[];
};

function parseFilter(value: string | null): SearchFilter {
  if (value === 'people' || value === 'catches' || value === 'baits') {
    return value;
  }
  return 'all';
}

function baitTitle(item: SearchCatch): string {
  if (item.baitMixData?.mixName) return item.baitMixData.mixName;
  if (item.description) return item.description;
  return 'Bait mix';
}

function SearchPageContent(): React.JSX.Element {
  const { dict, mounted } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialType = parseFilter(searchParams.get('type'));
  const { userId, followingCount, setFollowingCount } = useUserStore();

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilter>(initialType);
  const [results, setResults] = useState<SearchResponse>({
    people: [],
    catches: [],
    baits: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
    setFilter(initialType);
  }, [initialQuery, initialType]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults({ people: [], catches: [], baits: [] });
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          type: filter,
        });
        const response = await fetch(`/api/search?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = (await response.json()) as SearchResponse;
        setResults({
          people: Array.isArray(data.people) ? data.people : [],
          catches: Array.isArray(data.catches) ? data.catches : [],
          baits: Array.isArray(data.baits) ? data.baits : [],
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Search error:', err);
        setError('Unable to search right now');
        setResults({ people: [], catches: [], baits: [] });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query, filter]);

  const updateUrl = (nextQuery: string, nextFilter: SearchFilter): void => {
    const trimmed = nextQuery.trim();
    const params = new URLSearchParams();
    if (trimmed.length > 0) params.set('q', trimmed);
    if (nextFilter !== 'all') params.set('type', nextFilter);
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false });
  };

  const handleQueryChange = (value: string): void => {
    setQuery(value);
    updateUrl(value, filter);
  };

  const handleFilterChange = (next: SearchFilter): void => {
    setFilter(next);
    updateUrl(query, next);
  };

  const handleFollowChange = (targetId: string, nextFollowing: boolean): void => {
    setResults((prev) => ({
      ...prev,
      people: prev.people.map((user) =>
        user.id === targetId ? { ...user, isFollowing: nextFollowing } : user,
      ),
    }));
    setFollowingCount(Math.max(0, followingCount + (nextFollowing ? 1 : -1)));
  };

  const filters = useMemo(
    () =>
      [
        { id: 'all' as const, label: mounted ? dict.searchAll || 'All' : 'All', icon: SearchIcon },
        {
          id: 'people' as const,
          label: mounted ? dict.searchPeople || 'People' : 'People',
          icon: Users,
        },
        {
          id: 'catches' as const,
          label: mounted ? dict.searchCatches || 'Catches' : 'Catches',
          icon: Fish,
        },
        {
          id: 'baits' as const,
          label: mounted ? dict.searchBaits || 'Bait mixes' : 'Bait mixes',
          icon: Wheat,
        },
      ] as const,
    [dict, mounted],
  );

  const showPeople = filter === 'all' || filter === 'people';
  const showCatches = filter === 'all' || filter === 'catches';
  const showBaits = filter === 'all' || filter === 'baits';
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= 2;
  const totalCount =
    (showPeople ? results.people.length : 0) +
    (showCatches ? results.catches.length : 0) +
    (showBaits ? results.baits.length : 0);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-[80px] text-zinc-100">
      <TelegramBackButton fallbackUrl="/" />
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={20}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder={
              mounted
                ? dict.searchPlaceholder || 'Search people, catches, bait mixes...'
                : 'Search...'
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-10 text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => {
            const Icon = item.icon;
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleFilterChange(item.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-sky-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                )}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 space-y-6 p-4">
        {isLoading && (
          <div className="py-10 text-center text-zinc-500">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
            {dict.loading}
          </div>
        )}

        {error && !isLoading && (
          <div className="py-10 text-center text-zinc-500">{error}</div>
        )}

        {!hasQuery && !isLoading && (
          <div className="py-10 text-center text-zinc-500">
            <SearchIcon className="mx-auto mb-2 text-zinc-600" size={48} />
            <p>
              {mounted
                ? dict.searchPlaceholder || 'Search people, catches, bait mixes...'
                : 'Search...'}
            </p>
          </div>
        )}

        {hasQuery && !isLoading && !error && totalCount === 0 && (
          <div className="space-y-3 py-10 text-center text-zinc-500">
            {filter === 'people' && !userId ? (
              <>
                <p>{dict.searchPeopleLogin || 'Sign in to search anglers'}</p>
                <Link
                  href={`/login?next=/search?q=${encodeURIComponent(trimmedQuery)}&type=people`}
                  className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  {dict.searchPeopleLogin || 'Sign in to search anglers'}
                </Link>
              </>
            ) : (
              <p>{dict.noResults}</p>
            )}
          </div>
        )}

        {hasQuery && !isLoading && showPeople && results.people.length > 0 && (
          <section className="space-y-2">
            {filter === 'all' && (
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {dict.searchPeople || 'People'}
              </h2>
            )}
            {results.people.map((user) => {
              const displayName =
                user.firstName || user.username || dict.angler;
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
                >
                  <Link
                    href={`/user/${user.id}`}
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
                      <div className="text-xs text-zinc-500">
                        {user._count.catches} {dict.catches} ·{' '}
                        {user._count.followers} {dict.followers}
                      </div>
                    </div>
                  </Link>
                  {userId && (
                    <FollowButton
                      userId={user.id}
                      currentUserId={userId}
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
          </section>
        )}

        {hasQuery && !isLoading && showCatches && results.catches.length > 0 && (
          <section className="space-y-2">
            {filter === 'all' && (
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {dict.searchCatches || 'Catches'}
              </h2>
            )}
            {results.catches.map((item) => {
              const title =
                item.species || item.description || dict.catch || 'Catch';
              const angler =
                item.user.firstName || item.user.username || dict.angler;

              return (
                <Link
                  key={item.id}
                  href={`/catch/${item.id}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {item.imageUrl ? (
                      <CachedImage
                        src={item.imageUrl}
                        alt={title}
                        className="h-full w-full"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <Fish size={22} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-zinc-200">
                      {title}
                    </div>
                    <div className="truncate text-sm text-zinc-500">
                      {angler}
                      {item.location ? ` · ${item.location}` : ''}
                      {item.weight != null ? ` · ${item.weight} kg` : ''}
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {hasQuery && !isLoading && showBaits && results.baits.length > 0 && (
          <section className="space-y-2">
            {filter === 'all' && (
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {dict.searchBaits || 'Bait mixes'}
              </h2>
            )}
            {results.baits.map((item) => {
              const title = baitTitle(item);
              const angler =
                item.user.firstName || item.user.username || dict.angler;

              return (
                <Link
                  key={item.id}
                  href={`/catch/${item.id}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {item.imageUrl ? (
                      <CachedImage
                        src={item.imageUrl}
                        alt={title}
                        className="h-full w-full"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <Wheat size={22} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-zinc-200">
                      {title}
                    </div>
                    <div className="truncate text-sm text-zinc-500">
                      {angler}
                      {item.location ? ` · ${item.location}` : ''}
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function SearchPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          Loading search...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
