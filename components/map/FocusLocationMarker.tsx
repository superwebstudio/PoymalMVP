"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface FocusLocationMarkerProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  location: { lat: number; lng: number } | null;
}

function createFocusPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "focus-location-marker";
  el.style.width = "36px";
  el.style.height = "44px";
  el.style.pointerEvents = "none";
  el.style.zIndex = "20";
  el.innerHTML = `
    <div style="position:relative;top:-4px;display:flex;flex-direction:column;align-items:center;">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.45));">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
        <circle cx="12" cy="10" r="3" fill="#18181b" stroke="#18181b"/>
      </svg>
      <div style="width:10px;height:10px;background:rgba(245,158,11,0.35);border-radius:9999px;filter:blur(2px);margin-top:-2px;"></div>
    </div>
  `;
  return el;
}

export function FocusLocationMarker({
  map,
  location,
}: FocusLocationMarkerProps): null {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Keep the pin in sync with location — do not tear down on every update
  useEffect(() => {
    if (!map.current) return;

    if (!location) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const ensureMarker = () => {
      if (!map.current || !location) return;

      if (!markerRef.current) {
        try {
          markerRef.current = new mapboxgl.Marker({
            element: createFocusPinElement(),
            anchor: "bottom",
          })
            .setLngLat([location.lng, location.lat])
            .addTo(map.current);
        } catch (error) {
          console.error("Error adding focus location marker:", error);
        }
        return;
      }

      markerRef.current.setLngLat([location.lng, location.lat]);
    };

    if (map.current.loaded()) {
      ensureMarker();
    } else {
      map.current.once("load", ensureMarker);
    }
  }, [map, location?.lat, location?.lng, location]);

  // Remove only when the component unmounts
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  return null;
}
