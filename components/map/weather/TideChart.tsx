"use client";

import React from 'react';
import { Waves } from 'lucide-react';
import { TideData } from '@/stores/useWeatherStore';
import { CollapsibleSection } from './CollapsibleSection';

interface TideChartProps {
    dict: any;
    data: TideData;
    isOpen: boolean;
    onToggle: (section: string) => void;
}

export const TideChart: React.FC<TideChartProps> = ({ dict, data, isOpen, onToggle }) => (
    <CollapsibleSection
        id="tide"
        title={dict.tideChart || 'Tide Chart'}
        icon={<Waves className="text-blue-400" size={18} />}
        isOpen={isOpen}
        onToggle={onToggle}
    >
        <div className="space-y-3 pt-2 border-t border-zinc-700/50">
            <Row
                label={dict.nextHighTide || 'Next High Tide'}
                time={data.nextHigh.time}
                value={`${data.nextHigh.height.toFixed(1)}m`}
                accent="text-cyan-400"
            />
            <Row
                label={dict.nextLowTide || 'Next Low Tide'}
                time={data.nextLow.time}
                value={`${data.nextLow.height.toFixed(1)}m`}
                accent="text-blue-400"
            />

            <div className="mt-4">
                <div className="text-xs text-zinc-400 mb-2">{dict.tideChart24h || '24h Tide Chart'}</div>
                <div className="relative h-20 bg-zinc-900/50 rounded-lg p-2">
                    {data.times.map((tide, idx) => {
                        const time = new Date(tide.time);
                        const hour = time.getHours();
                        const heightPercent = ((tide.height - 1) / 3) * 100;
                        return (
                            <div
                                key={idx}
                                className="absolute bottom-0 rounded-t"
                                style={{
                                    left: `${(hour / 24) * 100}%`,
                                    width: '4px',
                                    height: `${Math.max(10, heightPercent)}%`,
                                    backgroundColor: tide.type === 'high' ? '#22d3ee' : '#3b82f6',
                                    transform: 'translateX(-50%)',
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    </CollapsibleSection>
);

const Row = ({ label, time, value, accent }: { label: string; time: string; value: string; accent: string }) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-white font-medium">
                {new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className={`font-semibold ${accent}`}>{value}</span>
        </div>
    </div>
);


