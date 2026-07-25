"use client";

import { SelectionGrid } from '@/components/SelectionGrid';
import { Sun, Satellite, Moon } from 'lucide-react';

interface MapStyleGridProps {
    mapTheme: string;
    onSelect: (theme: string) => void;
    dict: any;
}

export function MapStyleGrid({ mapTheme, onSelect, dict }: MapStyleGridProps) {
    const MAP_STYLE_OPTIONS = [
        { id: 'outdoors', label: dict?.outdoors || 'Outdoors', icon: Sun },
        { id: 'satellite', label: dict?.satellite || 'Satellite', icon: Satellite },
        { id: 'dark', label: dict?.dark || 'Dark Mode', icon: Moon },
    ];

    return (
        <div className="mb-8">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block ml-1">
                {dict?.mapStyle || 'Map Style'}
            </label>
            <SelectionGrid
                options={MAP_STYLE_OPTIONS}
                selectedId={mapTheme}
                onSelect={(id: any) => onSelect(id)}
                columns={3}
                variant="minimal"
            />
        </div>
    );
}

