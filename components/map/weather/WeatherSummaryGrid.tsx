"use client";

import React from 'react';
import { Droplets, Gauge, Thermometer, Wind } from 'lucide-react';
import { WeatherData } from '@/stores/useWeatherStore';
import { getWindDirectionLabel } from './utils';

interface WeatherSummaryGridProps {
    dict: any;
    weatherData: WeatherData;
}

export const WeatherSummaryGrid: React.FC<WeatherSummaryGridProps> = ({ dict, weatherData }) => (
    <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/50">
        <div className="grid grid-cols-2 gap-3">
            <SummaryItem
                icon={<Thermometer size={18} className="text-red-400" />}
                label={dict.temperature || 'Temp'}
                value={`${Math.round(weatherData.temperature)}°C`}
            />
            <SummaryItem
                icon={<Wind size={18} className="text-cyan-400" />}
                label={dict.wind || 'Wind'}
                value={`${Math.round(weatherData.windSpeed)} km/h ${getWindDirectionLabel(weatherData.windDirection, dict)}`}
            />
            <SummaryItem
                icon={<Droplets size={18} className="text-blue-400" />}
                label={dict.humidity || 'Humidity'}
                value={`${weatherData.humidity}%`}
            />
            <SummaryItem
                icon={<Gauge size={18} className="text-purple-400" />}
                label={dict.pressure || 'Pressure'}
                value={`${Math.round(weatherData.pressure)} hPa`}
            />
        </div>
    </div>
);

interface SummaryItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ icon, label, value }) => (
    <div className="flex items-center gap-2">
        {icon}
        <div>
            <div className="text-xs text-zinc-400">{label}</div>
            <div className="text-lg font-bold text-white">{value}</div>
        </div>
    </div>
);


