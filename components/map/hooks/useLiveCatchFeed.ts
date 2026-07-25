"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import type { MapCatch } from "@/components/map/hooks/useCatchMarkers";
import { useLiveMapStore, type LiveCatchEvent } from "@/stores/useLiveMapStore";
import { useUserStore } from "@/stores/useUserStore";

const POLL_MS = 20_000;
const PULSE_MS = 2_800;
const CLUSTER_KM = 1.5;
const MIN_ZOOM = 8;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clusterCatches(catches: MapCatch[]): MapCatch[][] {
  const remaining = [...catches];
  const groups: MapCatch[][] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const group = [seed];

    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      const candidate = remaining[i];
      if (
        haversineKm(
          seed.latitude,
          seed.longitude,
          candidate.latitude,
          candidate.longitude
        ) <= CLUSTER_KM
      ) {
        group.push(candidate);
        remaining.splice(i, 1);
      }
    }

    groups.push(group);
  }

  return groups;
}

function toLiveEvent(group: MapCatch[]): LiveCatchEvent {
  const now = Date.now();
  const avgLat =
    group.reduce((sum, item) => sum + item.latitude, 0) / group.length;
  const avgLng =
    group.reduce((sum, item) => sum + item.longitude, 0) / group.length;

  return {
    id: `live-${group.map((item) => item.id).join("-")}-${now}`,
    type: group.length > 1 ? "cluster" : "single",
    catches: group,
    latitude: avgLat,
    longitude: avgLng,
    createdAt: now,
    toastVisible: true,
    pulseUntil: now + PULSE_MS,
  };
}

interface UseLiveCatchFeedOptions {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  knownCatches: MapCatch[];
  onNewCatches: (catches: MapCatch[]) => void;
}

export function useLiveCatchFeed({
  map,
  knownCatches,
  onNewCatches,
}: UseLiveCatchFeedOptions): void {
  const liveMode = useLiveMapStore((state) => state.liveMode);
  const addEvents = useLiveMapStore((state) => state.addEvents);
  const clearExpiredPulses = useLiveMapStore((state) => state.clearExpiredPulses);
  const userId = useUserStore((state) => state.userId);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);
  const onNewCatchesRef = useRef(onNewCatches);
  onNewCatchesRef.current = onNewCatches;

  // Seed known catches so existing markers don't toast on first poll
  useEffect(() => {
    if (!liveMode) {
      seededRef.current = false;
      return;
    }

    knownCatches.forEach((item) => seenIdsRef.current.add(item.id));
    if (knownCatches.length > 0) {
      seededRef.current = true;
    }
  }, [liveMode, knownCatches]);

  useEffect(() => {
    if (!liveMode) return;

    const pulseTimer = window.setInterval(() => {
      clearExpiredPulses();

      // Auto-dismiss toasts after ~5s
      const state = useLiveMapStore.getState();
      const now = Date.now();
      state.events.forEach((event) => {
        if (event.toastVisible && now - event.createdAt > 5_000) {
          state.dismissToast(event.id);
        }
      });
    }, 1000);

    return () => window.clearInterval(pulseTimer);
  }, [liveMode, clearExpiredPulses]);

  useEffect(() => {
    if (!liveMode) return;

    let cancelled = false;
    let pollTimer: number | null = null;

    const poll = async (): Promise<void> => {
      const mapInstance = map.current;
      if (!mapInstance || cancelled) return;

      const zoom = mapInstance.getZoom();
      if (zoom < MIN_ZOOM) return;

      const bounds = mapInstance.getBounds();
      if (!bounds) return;

      try {
        const params = new URLSearchParams({
          mode: "explore",
          minLat: bounds.getSouth().toString(),
          maxLat: bounds.getNorth().toString(),
          minLng: bounds.getWest().toString(),
          maxLng: bounds.getEast().toString(),
        });

        const response = await fetch(`/api/catch/map?${params}`, {
          credentials: "include",
        });
        if (!response.ok || cancelled) return;

        const data = (await response.json()) as {
          catches?: MapCatch[];
        } | MapCatch[];
        const catches = Array.isArray(data) ? data : data.catches || [];

        if (!seededRef.current) {
          catches.forEach((item) => seenIdsRef.current.add(item.id));
          seededRef.current = true;
          return;
        }

        const fresh = catches.filter((item) => {
          if (seenIdsRef.current.has(item.id)) return false;
          // Don't notify for the viewer's own catches
          if (userId && item.user?.id === userId) {
            seenIdsRef.current.add(item.id);
            return false;
          }
          return true;
        });

        if (fresh.length === 0) return;

        fresh.forEach((item) => seenIdsRef.current.add(item.id));
        onNewCatchesRef.current(fresh);

        const groups = clusterCatches(fresh);
        addEvents(groups.map(toLiveEvent));
      } catch (error) {
        console.error("Live catch poll failed:", error);
      }
    };

    void poll();
    pollTimer = window.setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      if (pollTimer != null) window.clearInterval(pollTimer);
    };
  }, [liveMode, map, userId, addEvents]);
}
