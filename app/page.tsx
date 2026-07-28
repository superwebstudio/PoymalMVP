import { Suspense } from 'react';
import { getFeed } from '@/app/api/feed/_service';
import { getCurrentUserSummary } from '@/lib/get-current-user-summary';
import HomePageClient from './page.client';

function HomeFallback(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
      Loading feed...
    </div>
  );
}

async function HomeContent(): Promise<React.JSX.Element> {
  // Avoid caching empty/failed feeds — client also refetches if SSR is empty
  const [initialFeed, initialUser] = await Promise.all([
    getFeed(undefined, 'all'),
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
