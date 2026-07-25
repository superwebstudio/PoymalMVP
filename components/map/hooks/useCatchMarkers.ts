"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import React from "react";

export type MapMode = "hotspots" | "my-spots" | "explore";

export interface MapCatch {
  id: string;
  latitude: number;
  longitude: number;
  species: string | null;
  imageUrl: string | null;
  weight?: number | null;
  length?: number | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    username: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

function markerColorFor(
  mode: MapMode,
  isUserCatch: boolean
): string {
  if (isUserCatch) return "#3b82f6";
  if (mode === "hotspots") return "#ef4444";
  return "#10b981"; // explore (and any non-owner fallback)
}

export function useCatchMarkers(
  map: React.MutableRefObject<mapboxgl.Map | null>,
  catches: MapCatch[],
  mode: MapMode,
  onCatchClick: (catchItem: MapCatch) => void,
  currentUserId?: string | null,
  selectedCatchId?: string | null
) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    // Always clear previous markers first (including empty list / mode switch)
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!map.current) return;

    // In My Catches, never render anyone else's markers (guards against stale state)
    const visible =
      mode === "my-spots" && currentUserId
        ? catches.filter((item) => item.user?.id === currentUserId)
        : catches;

    visible.forEach((catchItem) => {
      if (!catchItem.latitude || !catchItem.longitude) return;

      const isSelected = selectedCatchId === catchItem.id;
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = isSelected ? "40px" : "32px";
      el.style.height = isSelected ? "40px" : "32px";
      el.style.borderRadius = "50%";

      const isUserCatch = !!(
        currentUserId && catchItem.user?.id === currentUserId
      );
      el.style.backgroundColor = isSelected
        ? "#f59e0b"
        : markerColorFor(mode, isUserCatch);
      el.style.border = isSelected ? "3px solid #fef3c7" : "2px solid white";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.boxShadow = isSelected
        ? "0 0 0 4px rgba(245,158,11,0.35), 0 2px 8px rgba(0,0,0,0.4)"
        : "0 2px 4px rgba(0,0,0,0.3)";
      el.style.zIndex = isSelected ? "15" : "5";
      if (isSelected) {
        el.style.transform = "scale(1.08)";
      }

      const icon = document.createElement("div");
      icon.innerHTML = catchItem.species ? "🎣" : "📍";
      icon.style.fontSize = isSelected ? "18px" : "16px";
      el.appendChild(icon);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([catchItem.longitude, catchItem.latitude])
        .addTo(map.current!);

      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onCatchClick(catchItem);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [catches, mode, onCatchClick, currentUserId, selectedCatchId, map]);

  return markersRef;
}
