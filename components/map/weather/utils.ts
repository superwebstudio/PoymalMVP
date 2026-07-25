"use client";

import { SolunarData, WeatherData } from '@/stores/useWeatherStore';

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export const getWindDirectionLabel = (degrees: number, dict?: any) => {
    const index = Math.round(degrees / 45) % 8;
    const direction = DIRECTIONS[index];
    const map: Record<string, string> = {
        N: dict?.north || 'N',
        NE: dict?.northeast || 'NE',
        E: dict?.east || 'E',
        SE: dict?.southeast || 'SE',
        S: dict?.south || 'S',
        SW: dict?.southwest || 'SW',
        W: dict?.west || 'W',
        NW: dict?.northwest || 'NW',
    };
    return map[direction] || direction;
};

type Period = 'morning' | 'afternoon' | 'evening';

export const calculatePeriodRating = (
    period: Period,
    solunar: SolunarData | null,
    weather: WeatherData | null
): { stars: number; color: string } => {
    let score = 0;

    if (period === 'morning') score += 7;
    else if (period === 'afternoon') score += 5;
    else score += 7;

    if (solunar) {
        const biteEffect = Math.floor((solunar.biteRating - 50) / 10);
        score += biteEffect;

        const ranges: Record<Period, [number, number]> = {
            morning: [5, 11],
            afternoon: [11, 17],
            evening: [17, 21],
        };
        const [startH, endH] = ranges[period];

        const hasMajor = solunar.majorPeriods.some((p) => {
            if (p.type !== 'major') return false;
            const hour = new Date(p.start).getHours();
            return hour >= startH && hour <= endH;
        });
        if (hasMajor) score += 2;
    }

    if (weather) {
        if (weather.pressure >= 1010 && weather.pressure <= 1020) score += 1;
        if (weather.windSpeed > 30) score -= 2;
        else if (weather.windSpeed > 15) score -= 1;
    }

    let stars = 1;
    if (score >= 8) stars = 3;
    else if (score >= 5) stars = 2;

    const color = stars === 3 ? 'text-green-400' : stars === 2 ? 'text-yellow-400' : 'text-red-400';
    return { stars, color };
};

export const formatStars = (count: number) => '★'.repeat(count);


