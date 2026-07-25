"use client";

import type { MapCatch } from "@/components/map/hooks/useCatchMarkers";
import {
  useLiveMapStore,
  type LiveCatchEvent,
} from "@/stores/useLiveMapStore";

const PULSE_MS = 2_800;

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function makeCatch(
  id: string,
  lat: number,
  lng: number,
  overrides: Partial<MapCatch> & {
    firstName: string;
    species: string;
    length?: number;
    minutesAgo?: number;
  }
): MapCatch {
  return {
    id,
    latitude: lat,
    longitude: lng,
    species: overrides.species,
    length: overrides.length ?? null,
    weight: overrides.weight ?? null,
    imageUrl: null,
    createdAt: minutesAgoIso(overrides.minutesAgo ?? 1),
    user: {
      id: `sim-user-${id}`,
      firstName: overrides.firstName,
      username: overrides.firstName.toLowerCase(),
    },
    _count: { likes: 3, comments: 1 },
  };
}

function toLiveEvent(group: MapCatch[]): LiveCatchEvent {
  const now = Date.now();
  const latitude =
    group.reduce((sum, item) => sum + item.latitude, 0) / group.length;
  const longitude =
    group.reduce((sum, item) => sum + item.longitude, 0) / group.length;

  return {
    id: `sim-${group.map((item) => item.id).join("-")}-${now}`,
    type: group.length > 1 ? "cluster" : "single",
    catches: group,
    latitude,
    longitude,
    createdAt: now,
    toastVisible: true,
    pulseUntil: now + PULSE_MS,
  };
}

/**
 * Injects sample live catch events near a map center so Live Mode UI can be previewed.
 */
export function simulateLiveCatchActivity(
  center: { lat: number; lng: number },
  onNewCatches: (catches: MapCatch[]) => void
): () => void {
  const timers: number[] = [];
  const { addEvents } = useLiveMapStore.getState();

  // Offset ~150–400m so markers aren't stacked on the exact center
  const single = makeCatch("sim-pike-1", center.lat + 0.0018, center.lng - 0.0012, {
    firstName: "John",
    species: "pike",
    length: 62,
    minutesAgo: 1,
  });

  const cluster = [
    makeCatch("sim-carp-1", center.lat - 0.0011, center.lng + 0.0009, {
      firstName: "Anna",
      species: "carp",
      length: 48,
      minutesAgo: 2,
    }),
    makeCatch("sim-perch-1", center.lat - 0.0008, center.lng + 0.0014, {
      firstName: "Marco",
      species: "perch",
      length: 28,
      minutesAgo: 3,
    }),
    makeCatch("sim-zander-1", center.lat - 0.0015, center.lng + 0.0004, {
      firstName: "Sofia",
      species: "zander",
      length: 55,
      minutesAgo: 4,
    }),
    makeCatch("sim-trout-1", center.lat - 0.0005, center.lng + 0.0018, {
      firstName: "Leo",
      species: "trout",
      length: 34,
      minutesAgo: 5,
    }),
    makeCatch("sim-bream-1", center.lat - 0.0019, center.lng + 0.0011, {
      firstName: "Nina",
      species: "bream",
      length: 41,
      minutesAgo: 6,
    }),
  ];

  timers.push(
    window.setTimeout(() => {
      onNewCatches([single]);
      addEvents([toLiveEvent([single])]);
    }, 500)
  );

  timers.push(
    window.setTimeout(() => {
      onNewCatches(cluster);
      addEvents([toLiveEvent(cluster)]);
    }, 2800)
  );

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
  };
}
