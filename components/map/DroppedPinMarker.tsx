"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useSavedLocationsStore } from "@/stores/useSavedLocationsStore";

interface DroppedPinMarkerProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  location: { lat: number; lng: number } | null;
}

function createPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "dropped-pin-marker";
  el.style.width = "32px";
  el.style.height = "40px";
  el.style.pointerEvents = "none";
  el.innerHTML = `
    <div class="dropped-pin-marker-bounce" style="position:relative;top:-4px;display:flex;flex-direction:column;align-items:center;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
        <circle cx="12" cy="10" r="3" fill="white" stroke="white"/>
      </svg>
      <div style="width:8px;height:8px;background:rgba(0,0,0,0.3);border-radius:9999px;filter:blur(2px);margin-top:-2px;"></div>
    </div>
  `;
  return el;
}

export function DroppedPinMarker({
  map,
  location,
}: DroppedPinMarkerProps): null {
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const locations = useSavedLocationsStore((state) => state.locations);

  const isSaved = location
    ? locations.some(
        (loc) =>
          Math.abs(loc.latitude - location.lat) < 0.0001 &&
          Math.abs(loc.longitude - location.lng) < 0.0001
      )
    : false;

  useEffect(() => {
    if (!map.current || !location || isSaved) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const addOrMoveMarker = () => {
      if (!map.current || !location || isSaved) return;

      if (!markerRef.current) {
        try {
          markerRef.current = new mapboxgl.Marker({
            element: createPinElement(),
            anchor: "bottom",
          })
            .setLngLat([location.lng, location.lat])
            .addTo(map.current);
        } catch (error) {
          console.error("Error adding dropped pin marker:", error);
        }
        return;
      }

      markerRef.current.setLngLat([location.lng, location.lat]);
    };

    if (map.current.loaded()) {
      addOrMoveMarker();
    } else {
      map.current.once("load", addOrMoveMarker);
    }

    return () => {
      // Defer removal so we never tear down during an in-flight React render
      const marker = markerRef.current;
      markerRef.current = null;
      if (marker) {
        queueMicrotask(() => {
          marker.remove();
        });
      }
    };
  }, [map, location?.lat, location?.lng, isSaved]);

  return null;
}
