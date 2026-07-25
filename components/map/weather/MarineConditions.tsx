"use client";

import React from 'react';
import { Waves } from 'lucide-react';
import { MarineData } from '@/stores/useWeatherStore';
import { getWindDirectionLabel } from './utils';
import { CollapsibleSection } from './CollapsibleSection';

interface MarineConditionsProps {
    dict: any;
    data: MarineData;
    isOpen: boolean;
    onToggle: (section: string) => void;
}

export const MarineConditions: React.FC<MarineConditionsProps> = ({ dict, data, isOpen, onToggle }) => (
    <CollapsibleSection
        id="marine"
        title={dict.marineConditions || 'Marine Conditions'}
        icon={<Waves className="text-cyan-400" size={18} />}
        isOpen={isOpen}
        onToggle={onToggle}
    >
        <div className="space-y-2 pt-2 border-t border-zinc-700/50">
            {data.waterTemperature !== null && (
                <Row label={dict.waterTemp || 'Water Temp'} value={`${Math.round(data.waterTemperature)}°C`} />
            )}
            {data.waveHeight !== null && data.waveHeight !== undefined && (
                <Row label={dict.waveHeight || 'Wave Height'} value={`${data.waveHeight.toFixed(2)} m`} />
            )}
            {data.waveDirection !== null && data.waveDirection !== undefined && (
                <Row label={dict.waveDirection || 'Wave Direction'} value={getWindDirectionLabel(data.waveDirection, dict)} />
            )}
        </div>
    </CollapsibleSection>
);

const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{value}</span>
    </div>
);

