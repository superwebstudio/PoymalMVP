"use client";

import React from 'react';
import { Fish } from 'lucide-react';
import { SolunarData, WeatherData } from '@/stores/useWeatherStore';
import { calculatePeriodRating, formatStars } from './utils';

interface BiteForecastCardProps {
    dict: any;
    solunarData: SolunarData;
    weatherData: WeatherData | null;
}

export const BiteForecastCard: React.FC<BiteForecastCardProps> = ({ dict, solunarData, weatherData }) => {
    const morningRating = calculatePeriodRating('morning', solunarData, weatherData);
    const afternoonRating = calculatePeriodRating('afternoon', solunarData, weatherData);
    const eveningRating = calculatePeriodRating('evening', solunarData, weatherData);

    const ratingChip = (label: string, rating: { stars: number; color: string }) => (
        <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
            <div className="text-xs text-zinc-400">{label}</div>
            <div className={`text-sm font-bold ${rating.color}`}>
                {formatStars(rating.stars)}
            </div>
        </div>
    );

    return (
        <div className="bg-gradient-to-r from-orange-600/70 to-purple-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Fish size={20} />
                    <span className="font-semibold">{dict.biteForecast || 'Bite Forecast'}</span>
                </div>
                <div className="text-3xl font-bold text-white">
                    {solunarData.biteRating}%
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {ratingChip(dict.morning || 'Morning', morningRating)}
                {ratingChip(dict.afternoon || 'Afternoon', afternoonRating)}
                {ratingChip(dict.evening || 'Evening', eveningRating)}
            </div>
        </div>
    );
};


