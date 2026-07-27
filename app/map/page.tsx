import { Suspense } from 'react';
import { getSavedLocations } from '@/app/api/saved-locations/_service';
import { getCurrentUserSummary } from '@/lib/get-current-user-summary';
import MapPageLoader from './MapPageLoader';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const user = await getCurrentUserSummary();

  let initialSavedLocations: unknown[] = [];
  if (user?.id) {
    initialSavedLocations = await getSavedLocations(user.id);
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          Loading map...
        </div>
      }
    >
      <MapPageLoader initialSavedLocations={initialSavedLocations} />
    </Suspense>
  );
}
