"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React from 'react';

export function useMap(mapTheme: string) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

        const styleMap: Record<string, string> = {
            'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
            'satellite': 'mapbox://styles/mapbox/satellite-v9',
            'dark': 'mapbox://styles/mapbox/dark-v11',
        };
        // Fallback to outdoors if theme is 'standard' or unknown
        const theme = mapTheme === 'standard' ? 'outdoors' : mapTheme;
        const style = styleMap[theme] || styleMap['outdoors'];


        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style,
            center: [0, 0],
            zoom: 2,
            preserveDrawingBuffer: true, // Helps with rendering
            trackResize: false, // 👈 KEY FIX - don't auto-resize
        });
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update map style when theme changes
    useEffect(() => {
        if (!map.current) return;
        const styleMap: Record<string, string> = {
            'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
            'satellite': 'mapbox://styles/mapbox/satellite-v9',
            'dark': 'mapbox://styles/mapbox/dark-v11',
        };
        // Fallback to outdoors if theme is 'standard' or unknown
        const theme = mapTheme === 'standard' ? 'outdoors' : mapTheme;
        const style = styleMap[theme] || styleMap['outdoors'];
        map.current.setStyle(style);
    }, [mapTheme]);

    return { mapContainer, map };
}

