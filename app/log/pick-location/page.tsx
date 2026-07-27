"use client";

import dynamic from 'next/dynamic';

const LocationPickerPage = dynamic(
  () =>
    import('@/components/LogCatchPage/LocationPickerPage').then(
      (mod) => mod.LocationPickerPage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading map...
      </div>
    ),
  },
);

export default function PickLocationPage() {
  return <LocationPickerPage />;
}
