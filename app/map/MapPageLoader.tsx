'use client';

import dynamic from 'next/dynamic';

const MapPageClient = dynamic(() => import('./page.client'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
      Loading map...
    </div>
  ),
});

interface MapPageLoaderProps {
  initialSavedLocations: unknown[];
}

export default function MapPageLoader({
  initialSavedLocations,
}: MapPageLoaderProps): React.JSX.Element {
  return (
    <MapPageClient initialSavedLocations={initialSavedLocations as never[]} />
  );
}
