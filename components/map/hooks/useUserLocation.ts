"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useNotificationStore } from '@/stores/useNotificationStore';

const GEO_OPTIONS_FAST: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 120000,
};

const GEO_OPTIONS_PRECISE: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
};

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        return 'Location needs a secure connection. On phone, use HTTPS or localhost — http://192.168.x.x is blocked.';
    }

    if (error.code === error.PERMISSION_DENIED) {
        return 'Allow location access in your browser settings.';
    }

    if (error.code === error.TIMEOUT) {
        return 'Location timed out. Try again outdoors or with Wi‑Fi on.';
    }

    return 'Could not get your location. Please try again.';
}

export function useUserLocation(map: React.MutableRefObject<mapboxgl.Map | null>) {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
    const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const hasAutoCenteredRef = useRef(false);

    useEffect(() => {
        userLocationRef.current = userLocation;
    }, [userLocation]);

    // Get user location independently of map initialization
    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const next = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                userLocationRef.current = next;
                setUserLocation(next);
            },
            () => {
                // Ignore — user can retry via recenter button
            },
            GEO_OPTIONS_FAST
        );
    }, []);

    // Check if query params exist (to prevent auto-centering)
    const hasQueryParams = typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).has('lat') &&
        new URLSearchParams(window.location.search).has('lng');

    // Update map center and add marker when both map and location are available
    useEffect(() => {
        if (!map.current || !userLocation || hasAutoCenteredRef.current) return;

        if (hasQueryParams) {
            hasAutoCenteredRef.current = true;
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

            userLocationMarkerRef.current = new mapboxgl.Marker(el)
                .setLngLat([userLocation.lng, userLocation.lat])
                .addTo(map.current);
            return;
        }

        hasAutoCenteredRef.current = true;
        map.current.setCenter([userLocation.lng, userLocation.lat]);
        map.current.setZoom(10);

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

        userLocationMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(map.current);
    }, [map, userLocation, hasQueryParams]);

    const centerOnLocation = () => {
        if (!map.current) return;

        const flyToLocation = (lng: number, lat: number) => {
            if (!map.current) return;

            const run = () => {
                map.current?.flyTo({
                    center: [lng, lat],
                    zoom: 14,
                    duration: 1200,
                    essential: true,
                });
            };

            if (map.current.loaded()) {
                run();
            } else {
                map.current.once('load', run);
            }
        };

        const applyPosition = (lat: number, lng: number) => {
            const next = { lat, lng };
            userLocationRef.current = next;
            setUserLocation(next);
            flyToLocation(lng, lat);
        };

        // Immediate feedback from cached location
        const cached = userLocationRef.current;
        if (cached) {
            flyToLocation(cached.lng, cached.lat);
        }

        if (!navigator.geolocation) {
            if (!cached) {
                useNotificationStore.getState().addNotification({
                    message: 'Location is not available in this browser.',
                    type: 'error',
                });
            }
            return;
        }

        const onFailure = (error: GeolocationPositionError) => {
            const latest = userLocationRef.current;
            if (latest) {
                flyToLocation(latest.lng, latest.lat);
                return;
            }

            useNotificationStore.getState().addNotification({
                message: getGeolocationErrorMessage(error),
                type: 'error',
            });
        };

        // Fast network/Wi‑Fi fix first (more reliable on mobile), then precise GPS
        navigator.geolocation.getCurrentPosition(
            (position) => {
                applyPosition(position.coords.latitude, position.coords.longitude);
            },
            () => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        applyPosition(position.coords.latitude, position.coords.longitude);
                    },
                    onFailure,
                    GEO_OPTIONS_PRECISE
                );
            },
            GEO_OPTIONS_FAST
        );
    };

    return { userLocation, centerOnLocation };
}
