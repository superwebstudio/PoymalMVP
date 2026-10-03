"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface UseMapInitializationOptions {
    mapTheme: string;
    initialCenter?: [number, number];
    initialZoom?: number;
    mapContainerRef: React.RefObject<HTMLDivElement | null>;
    preserveDrawingBuffer?: boolean;
    trackResize?: boolean;
}

/**
 * Owns a single Mapbox map instance.
 * The public token comes from NEXT_PUBLIC_MAPBOX_TOKEN (restrict it by URL in the Mapbox dashboard).
 * Theme changes call setStyle so markers and the camera survive a style swap.
 */
export function useMapInitialization({
    mapTheme,
    initialCenter = [0, 0],
    initialZoom = 2,
    mapContainerRef,
    preserveDrawingBuffer = true,
    trackResize = false,
}: UseMapInitializationOptions) {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    // Capture first-paint camera only — don't remount when callers pass new array literals
    const initialCenterRef = useRef(initialCenter);
    const initialZoomRef = useRef(initialZoom);
    const preserveDrawingBufferRef = useRef(preserveDrawingBuffer);
    const trackResizeRef = useRef(trackResize);
    const mapThemeRef = useRef(mapTheme);

    // Initialize map once
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

        const styleMap: Record<string, string> = {
            'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
            'satellite': 'mapbox://styles/mapbox/satellite-v9',
            'dark': 'mapbox://styles/mapbox/dark-v11',
        };
        const theme = mapThemeRef.current === 'standard' ? 'outdoors' : mapThemeRef.current;
        const style = styleMap[theme] || styleMap['outdoors'];

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style,
            center: initialCenterRef.current,
            zoom: initialZoomRef.current,
            preserveDrawingBuffer: preserveDrawingBufferRef.current,
            trackResize: trackResizeRef.current,
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapContainerRef]);

    // Update map style when theme changes (without destroying the map)
    useEffect(() => {
        if (!mapRef.current) return;
        const styleMap: Record<string, string> = {
            'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
            'satellite': 'mapbox://styles/mapbox/satellite-v9',
            'dark': 'mapbox://styles/mapbox/dark-v11',
        };
        const theme = mapTheme === 'standard' ? 'outdoors' : mapTheme;
        const style = styleMap[theme] || styleMap['outdoors'];
        mapRef.current.setStyle(style);
    }, [mapTheme]);

    // Resize map when it loads
    useEffect(() => {
        if (!mapRef.current) return;

        const resizeMap = () => {
            if (mapRef.current && typeof mapRef.current.resize === 'function') {
                mapRef.current.resize();
            }
        };

        if (mapRef.current.loaded()) {
            resizeMap();
        } else {
            mapRef.current.once('load', resizeMap);
        }
    }, []);

    return mapRef;
}
