"use client";

import { useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import React from 'react';

export function useSelectedLocation(map: React.MutableRefObject<mapboxgl.Map | null>) {
    const selectedLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);

    const setSelectedLocation = (feature: any) => {
        // Retry mechanism: wait for map to be initialized
        if (!map.current) {
            // Try again after a short delay (map might still be initializing)
            const maxRetries = 20; // 2 seconds total (20 * 100ms)
            let retries = 0;

            const checkMap = setInterval(() => {
                retries++;
                if (map.current) {
                    clearInterval(checkMap);
                    // Recursively call to proceed with the rest of the logic
                    setSelectedLocation(feature);
                } else if (retries >= maxRetries) {
                    clearInterval(checkMap);
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Map failed to initialize after retries');
                    }
                }
            }, 100);

            return null;
        }

        // Ensure map is loaded before trying to fly
        if (!map.current.loaded()) {
            // Wait for map to load, then retry
            const loadHandler = () => {
                map.current?.off('load', loadHandler);
                setSelectedLocation(feature);
            };
            map.current.once('load', loadHandler);
            return null;
        }

        if (!feature || !feature.center || !Array.isArray(feature.center)) {
            console.error('Invalid feature data:', feature);
            return null;
        }

        const [lng, lat] = feature.center;

        if (typeof lng !== 'number' || typeof lat !== 'number') {
            console.error('Invalid coordinates:', { lng, lat });
            return null;
        }

        try {
            // Fly to the location
            map.current.flyTo({
                center: [lng, lat],
                zoom: 12,
                duration: 1500,
                essential: true // This animation is essential and will not be affected by prefers-reduced-motion
            });

            // Remove existing marker if any
            if (selectedLocationMarkerRef.current) {
                selectedLocationMarkerRef.current.remove();
            }

            // Create and add new marker
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
                .addTo(map.current);

            return { lat, lng, name: feature.place_name };
        } catch (error) {
            console.error('Error setting selected location:', error);
            return null;
        }
    };

    return { setSelectedLocation };
}

