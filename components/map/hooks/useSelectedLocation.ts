"use client";

import { useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import React from 'react';

type MapFeature = {
  center?: [number, number] | number[];
  place_name?: string;
};

function whenMapReady(
  mapRef: React.MutableRefObject<mapboxgl.Map | null>,
  onReady: (map: mapboxgl.Map) => void,
  attempt = 0,
): void {
  const map = mapRef.current;
  if (map?.loaded()) {
    onReady(map);
    return;
  }

  if (map) {
    map.once('load', () => {
      if (mapRef.current) onReady(mapRef.current);
    });
    return;
  }

  if (attempt >= 20) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Map failed to initialize after retries');
    }
    return;
  }

  window.setTimeout(() => {
    whenMapReady(mapRef, onReady, attempt + 1);
  }, 100);
}

export function useSelectedLocation(
  map: React.MutableRefObject<mapboxgl.Map | null>,
) {
  const selectedLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const setSelectedLocation = (feature: MapFeature) => {
    whenMapReady(map, (mapInstance) => {
      if (!feature?.center || !Array.isArray(feature.center)) {
        console.error('Invalid feature data:', feature);
        return;
      }

      const [lng, lat] = feature.center;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        console.error('Invalid coordinates:', { lng, lat });
        return;
      }

      try {
        mapInstance.flyTo({
          center: [lng, lat],
          zoom: 12,
          duration: 1500,
          essential: true,
        });

        if (selectedLocationMarkerRef.current) {
          selectedLocationMarkerRef.current.remove();
        }

        const el = document.createElement('div');
        el.className = 'selected-location-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3b82f6';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        el.style.cursor = 'pointer';

        selectedLocationMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(mapInstance);
      } catch (error) {
        console.error('Error setting selected location:', error);
      }
    });

    const center = feature?.center;
    if (
      center &&
      typeof center[0] === 'number' &&
      typeof center[1] === 'number'
    ) {
      return { lat: center[1], lng: center[0], name: feature.place_name };
    }
    return null;
  };

  return { setSelectedLocation };
}
