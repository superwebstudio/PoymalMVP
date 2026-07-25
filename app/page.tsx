import { getFeed } from '@/app/api/feed/_service';
import { getCurrentUser } from '@/lib/get-current-user';
import HomePageClient from './page.client';

// Server Component
export default async function HomePage() {
  // Fetch public feed on the server
  // For the initial load, we fetch 'all' feed type
  // Note: user-specific feed ('following') might need client-side hydration if userId isn't in cookies
  const initialFeed = await getFeed(undefined, 'all');

  // Try to get user if possible (e.g. from cookies if we implement them later)
  // For now, this might return null or a fallback user in dev
  const initialUser = await getCurrentUser();

  return (
    <HomePageClient
      initialFeed={initialFeed}
      initialUser={initialUser}
    />
  );
}