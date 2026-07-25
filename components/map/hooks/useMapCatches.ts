"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapCatch, MapMode } from "./useCatchMarkers";

export type { MapCatch };

interface Filters {
  dateFrom: string;
  dateTo: string;
  species?: string[];
}

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function onlyOwnCatches(
  catches: MapCatch[],
  userId: string | null
): MapCatch[] {
  if (!userId) return [];
  return catches.filter((item) => item.user?.id === userId);
}

export function useMapCatches(
  mode: MapMode,
  filters: Filters,
  userId: string | null,
  selectedSpecies?: string | null,
  bounds?: MapBounds | null,
  zoom?: number
) {
  const [catches, setCatches] = useState<MapCatch[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const modeRef = useRef(mode);
  const MIN_ZOOM_LEVEL = 8;

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const modeChanged = modeRef.current !== mode;
    modeRef.current = mode;

    const isMyCatches = mode === "my-spots";

    // On every mode change, wipe markers immediately so colors/positions can't flash
    if (modeChanged) {
      setCatches([]);
      setLoading(true);
    }

    if (!isMyCatches && zoom !== undefined && zoom < MIN_ZOOM_LEVEL) {
      setCatches([]);
      setLoading(false);
      return;
    }

    if (isMyCatches && !userId) {
      setCatches([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;

    fetchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          mode,
          ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
          ...(filters.dateTo && { dateTo: filters.dateTo }),
          ...(selectedSpecies && { species: selectedSpecies }),
        });

        if (!isMyCatches && bounds) {
          params.append("minLat", bounds.minLat.toString());
          params.append("maxLat", bounds.maxLat.toString());
          params.append("minLng", bounds.minLng.toString());
          params.append("maxLng", bounds.maxLng.toString());
        }

        const response = await fetch(`/api/catch/map?${params}`, {
          credentials: "include",
        });

        if (requestId !== requestIdRef.current) return;

        if (response.ok) {
          const data = (await response.json()) as {
            catches?: MapCatch[];
          } | MapCatch[];
          const next = Array.isArray(data) ? data : data.catches || [];
          setCatches(isMyCatches ? onlyOwnCatches(next, userId) : next);
        } else {
          setCatches([]);
        }
      } catch (error) {
        console.error("Error fetching map catches:", error);
        if (requestId === requestIdRef.current) {
          setCatches([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [mode, filters, userId, selectedSpecies, bounds, zoom]);

  const mergeCatches = (incoming: MapCatch[]) => {
    if (incoming.length === 0) return;
    if (mode === "my-spots") return;

    setCatches((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const fresh = incoming.filter((item) => !existingIds.has(item.id));
      if (fresh.length === 0) return prev;
      return [...fresh, ...prev];
    });
  };

  const upsertCatch = useCallback((item: MapCatch) => {
    setCatches((prev) => {
      const without = prev.filter((c) => c.id !== item.id);
      return [item, ...without];
    });
  }, []);

  return { catches, loading, mergeCatches, upsertCatch };
}
