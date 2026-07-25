import { getSavedLocations } from '@/app/api/saved-locations/_service';
import { getCurrentUser } from '@/lib/get-current-user';
import MapPageClient from './page.client';

// Server Component
export default async function MapPage() {
    // We try to get the user ID. 
    // Note: For now, since we don't strictly have cookies, this might return null or fallback.
    // If null, the client component will just see empty saved locations initially.
    const user = await getCurrentUser();

    let initialSavedLocations: any[] = [];
    if (user?.id) {
        initialSavedLocations = await getSavedLocations(user.id);
    }

    return (
        <MapPageClient initialSavedLocations={initialSavedLocations} />
    );
}
