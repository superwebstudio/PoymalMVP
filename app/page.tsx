import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { getFeed } from '@/app/api/feed/_service';
import { getCurrentUserSummary } from '@/lib/get-current-user-summary';
import HomePageClient from './page.client';

const getCachedPublicFeed = unstable_cache(
  async () => getFeed(undefined, 'all'),
  ['home-public-feed-v1'],
  { revalidate: 60 },
);

function HomeFallback(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
      Loading feed...
    </div>
  );
}

async function HomeContent(): Promise<React.JSX.Element> {
  // Feed is cacheable; user is per-request (cookies). Keep them parallel.
  const [initialFeed, initialUser] = await Promise.all([
    getCachedPublicFeed(),
    getCurrentUserSummary(),
  ]);

  return (
    <HomePageClient initialFeed={initialFeed} initialUser={initialUser} />
  );
}

export default function HomePage(): React.JSX.Element {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
