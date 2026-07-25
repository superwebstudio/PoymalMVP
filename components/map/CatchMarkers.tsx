"use client";

import { useCatchMarkers, MapCatch, MapMode } from './hooks/useCatchMarkers';
import mapboxgl from 'mapbox-gl';

interface CatchMarkersProps {
    map: React.MutableRefObject<mapboxgl.Map | null>;
    catches: MapCatch[];
    mode: MapMode;
    onCatchClick: (catchItem: MapCatch) => void;
    currentUserId?: string | null;
    selectedCatchId?: string | null;
}

export function CatchMarkers({
    map,
    catches,
    mode,
    onCatchClick,
    currentUserId,
    selectedCatchId,
}: CatchMarkersProps) {
    useCatchMarkers(map, catches, mode, onCatchClick, currentUserId, selectedCatchId);
    return null;
}

