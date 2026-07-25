"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useLiveMapStore } from "@/stores/useLiveMapStore";
import type { MapCatch } from "@/components/map/hooks/useCatchMarkers";

interface LiveCatchMarkersProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  onCatchClick: (catchItem: MapCatch) => void;
  onClusterClick: (catches: MapCatch[], latitude: number, longitude: number) => void;
}

export function LiveCatchMarkers({
  map,
  onCatchClick,
  onClusterClick,
}: LiveCatchMarkersProps) {
  const events = useLiveMapStore((state) => state.events);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    const activeIds = new Set(events.map((event) => event.id));

    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    const now = Date.now();

    events.forEach((event) => {
      if (event.pulseUntil <= now && !event.toastVisible) return;

      const existing = markersRef.current.get(event.id);
      if (existing) return;

      const el = document.createElement("div");
      el.className = "live-catch-marker";
      el.style.cursor = "pointer";
      el.style.zIndex = "30";

      if (event.type === "cluster") {
        el.innerHTML = `
          <div class="live-catch-ripple"></div>
          <div class="live-catch-badge">${event.catches.length} new</div>
        `;
      } else {
        el.innerHTML = `
          <div class="live-catch-ripple"></div>
          <div class="live-catch-fish">🎣</div>
        `;
      }

      el.addEventListener("click", (clickEvent) => {
        clickEvent.stopPropagation();
        if (event.type === "cluster") {
          onClusterClick(event.catches, event.latitude, event.longitude);
        } else if (event.catches[0]) {
          onCatchClick(event.catches[0]);
        }
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([event.longitude, event.latitude])
        .addTo(mapInstance);

      markersRef.current.set(event.id, marker);

      window.setTimeout(() => {
        el.classList.add("live-catch-marker--settled");
      }, 2800);
    });
  }, [events, map, onCatchClick, onClusterClick]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
    };
  }, []);

  return null;
}
