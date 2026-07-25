"use client";

import { SelectionGrid } from '@/components/SelectionGrid';
import { Flame, User, Compass } from 'lucide-react';
import { MapMode } from '../hooks/useCatchMarkers';

interface ViewModeGridProps {
    mode: MapMode;
    onSelect: (mode: MapMode) => void;
    dict: any;
}

export function ViewModeGrid({ mode, onSelect, dict }: ViewModeGridProps) {
    const VIEW_MODE_OPTIONS = [
        { id: 'hotspots', label: dict?.hotspots || 'Hotspots', icon: Flame, description: dict?.popularLocations || 'Popular locations' },
        { id: 'my-spots', label: dict?.myCatches || dict?.mySpots || 'My Catches', icon: User, description: dict?.myCatchesDesc || dict?.yourLogbook || 'Your catch logbook on the map' },
        { id: 'explore', label: dict?.explore || 'Explore', icon: Compass, description: dict?.discoverNew || 'Discover new' },
    ];

    return (
        <div className="mb-6">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block ml-1">
                {dict?.viewMode || "View Mode"}
            </label>
            <SelectionGrid
                options={VIEW_MODE_OPTIONS}
                selectedId={mode}
                onSelect={(id: any) => onSelect(id)}
                variant="subtle"
            />
        </div>
    );
}

