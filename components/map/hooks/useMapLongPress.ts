"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseMapLongPressOptions {
    map: React.MutableRefObject<mapboxgl.Map | null>;
    onLongPress: (location: { lat: number; lng: number }) => void;
    enabled?: boolean;
    duration?: number; // milliseconds
    moveThreshold?: number; // degrees (for lat/lng movement)
    excludedSelectors?: string[]; // CSS selectors to ignore touches on
}

export function useMapLongPress({
    map,
    onLongPress,
    enabled = true,
    duration = 500,
    moveThreshold = 0.001,
    excludedSelectors = [],
}: UseMapLongPressOptions) {
    const longPressTimer = useRef<number | null>(null);
    const longPressLocation = useRef<{ lat: number; lng: number } | null>(null);
    const pressStartCoords = useRef<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!map.current || !enabled) return;

        const isExcluded = (target: HTMLElement | null): boolean => {
            if (!target) return false;
            return excludedSelectors.some(selector => target.closest(selector));
        };

        const handleTouchStart = (e: mapboxgl.MapTouchEvent) => {
            // Check if touch is on excluded elements
            const target = e.originalEvent?.target as HTMLElement;
            if (isExcluded(target)) {
                return;
            }

            if (e.lngLat) {
                const location = {
                    lat: e.lngLat.lat,
                    lng: e.lngLat.lng,
                };
                longPressLocation.current = location;
                pressStartCoords.current = location;

                // Start long press timer
                longPressTimer.current = window.setTimeout(() => {
                    if (longPressLocation.current) {
                        onLongPress(longPressLocation.current);
                    }
                }, duration);
            }
        };

        const handleTouchEnd = () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            longPressLocation.current = null;
            pressStartCoords.current = null;
        };

        const handleTouchMove = (e: mapboxgl.MapTouchEvent) => {
            // Cancel long press if user moves finger significantly
            if (longPressTimer.current && pressStartCoords.current && e.lngLat) {
                const latDiff = Math.abs(e.lngLat.lat - pressStartCoords.current.lat);
                const lngDiff = Math.abs(e.lngLat.lng - pressStartCoords.current.lng);
                
                // Cancel if moved more than threshold
                if (latDiff > moveThreshold || lngDiff > moveThreshold) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                    longPressLocation.current = null;
                    pressStartCoords.current = null;
                }
            }
        };

        // Also handle mouse for desktop (right-click)
        const handleContextMenu = (e: mapboxgl.MapMouseEvent) => {
            e.preventDefault();
            
            // Check if click is on excluded elements
            const target = e.originalEvent?.target as HTMLElement;
            if (isExcluded(target)) {
                return;
            }

            if (e.lngLat) {
                onLongPress({
                    lat: e.lngLat.lat,
                    lng: e.lngLat.lng,
                });
            }
        };

        // Wait for map to load before adding event listeners
        const setupListeners = () => {
            if (!map.current) return;
            map.current.on('touchstart', handleTouchStart);
            map.current.on('touchend', handleTouchEnd);
            map.current.on('touchmove', handleTouchMove);
            map.current.on('contextmenu', handleContextMenu);
        };

        if (map.current.loaded()) {
            setupListeners();
        } else {
            map.current.once('load', setupListeners);
        }

        return () => {
            if (map.current) {
                map.current.off('touchstart', handleTouchStart);
                map.current.off('touchend', handleTouchEnd);
                map.current.off('touchmove', handleTouchMove);
                map.current.off('contextmenu', handleContextMenu);
            }
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, [map, onLongPress, enabled, duration, moveThreshold, excludedSelectors]);

    return { longPressLocation: longPressLocation.current };
}


