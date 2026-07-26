import { Suspense } from 'react';
import { getSavedLocations } from '@/app/api/saved-locations/_service';
import { getCurrentUser } from '@/lib/get-current-user';
import MapPageClient from './page.client';

export const dynamic = 'force-dynamic';

// Server Component
export default async function MapPage() {
    const user = await getCurrentUser();

    let initialSavedLocations: any[] = [];
    if (user?.id) {
        initialSavedLocations = await getSavedLocations(user.id);
    }

    return (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
              Loading...
            </div>
          }
        >
          <MapPageClient initialSavedLocations={initialSavedLocations} />
        </Suspense>
    );
}
