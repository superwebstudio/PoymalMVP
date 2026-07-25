"use client";

import React from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContainerProps {
    mapTheme: string;
    mapContainerRef: React.RefObject<HTMLDivElement | null>;
    onMapClick?: (e: React.MouseEvent) => void;
}

export function MapContainer({ mapTheme, mapContainerRef, onMapClick }: MapContainerProps) {
    return (
        <div
            ref={mapContainerRef}
            className="flex-1 relative"
            onClick={onMapClick}
        />
    );
}

