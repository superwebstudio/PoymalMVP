"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface UserLocationMarkerProps {
    map: React.MutableRefObject<mapboxgl.Map | null>;
    userLocation: { lat: number; lng: number } | null;
}

export function UserLocationMarker({ map, userLocation }: UserLocationMarkerProps) {
    const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);

    useEffect(() => {
        if (!map.current || !userLocation) return;

        // Wait for map to be loaded
        const addMarker = () => {
            if (!map.current || !userLocation) return;

            // Remove existing marker
            if (userLocationMarkerRef.current) {
                userLocationMarkerRef.current.remove();
            }

            const el = document.createElement('div');
            el.className = 'user-location-marker';
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#3b82f6';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

            try {
                userLocationMarkerRef.current = new mapboxgl.Marker(el)
                    .setLngLat([userLocation.lng, userLocation.lat])
                    .addTo(map.current);
            } catch (error) {
                console.error('Error adding user location marker:', error);
            }
        };

        if (map.current.loaded()) {
            addMarker();
        } else {
            map.current.once('load', addMarker);
        }

        return () => {
            if (userLocationMarkerRef.current) {
                userLocationMarkerRef.current.remove();
            }
        };
    }, [map, userLocation]);

    return null;
}

