import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Anchor, Droplets, Thermometer, Cloud, Wind, Gauge } from 'lucide-react';
import { HookIcon } from '../HookIcon';
import { useI18n } from '@/lib/useI18n';

interface FishDetailsBottomSheetProps {
    fish: any;
    catchData?: any; // Optional catch-level data (depth, waterTemp, weather)
    isOpen: boolean;
    onClose: () => void;
    dict: any;
}

interface ParsedWeather {
    temperature?: number;
    windSpeed?: number;
    windDirection?: string;
    pressure?: number;
    humidity?: number;
}

// Parse weather string like "20°C, 15 km/h NW, 1013 hPa, 65%"
function parseWeatherString(weatherStr: string | null | undefined): ParsedWeather | null {
    if (!weatherStr || typeof weatherStr !== 'string') return null;

    try {
        const parts = weatherStr.split(',').map(p => p.trim());
        const weather: ParsedWeather = {};

        parts.forEach(part => {
            // Temperature: "20°C"
            if (part.includes('°C')) {
                const tempMatch = part.match(/(-?\d+)/);
                if (tempMatch) weather.temperature = parseInt(tempMatch[1]);
            }
            // Wind: "15 km/h NW" or "15 km/h"
            else if (part.includes('km/h')) {
                const windMatch = part.match(/(\d+)\s*km\/h(?:\s+([A-Z]+))?/);
                if (windMatch) {
                    weather.windSpeed = parseInt(windMatch[1]);
                    if (windMatch[2]) weather.windDirection = windMatch[2];
                }
            }
            // Pressure: "1013 hPa"
            else if (part.includes('hPa')) {
                const pressureMatch = part.match(/(\d+)/);
                if (pressureMatch) weather.pressure = parseInt(pressureMatch[1]);
            }
            // Humidity: "65%"
            else if (part.includes('%')) {
                const humidityMatch = part.match(/(\d+)/);
                if (humidityMatch) weather.humidity = parseInt(humidityMatch[1]);
            }
        });

        return Object.keys(weather).length > 0 ? weather : null;
    } catch (err) {
        console.error('Error parsing weather string:', err);
        return null;
    }
}

export const FishDetailsBottomSheet: React.FC<FishDetailsBottomSheetProps> = ({
    fish,
    catchData,
    isOpen,
    onClose,
    dict,
}) => {
    const { dict: i18nDict } = useI18n();
    
    if (!isOpen || !fish) return null;

    // Use fish-level data if available, otherwise fall back to catch-level data
    const depth = fish.depth || catchData?.depth;
    const waterTemp = fish.waterTemp || catchData?.waterTemp;
    const weatherString = fish.weather || catchData?.weather;
    const parsedWeather = parseWeatherString(weatherString);

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[60]"
                onClick={onClose}
            />
            {/* Bottom Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl z-[60] max-h-[85vh] flex flex-col"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 rounded-t-2xl">
                    <h3 className="text-lg font-bold text-zinc-100">
                        {dict.details || 'Details'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 overflow-y-auto">
                    {/* Method and Bait */}
                    {(fish.method || fish.bait) && (
                        <div className="grid grid-cols-2 gap-3">
                            {/* Bait Box */}
                            {fish.bait && (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <HookIcon size={24} className="text-orange-400" />
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
                                            {dict.bait || 'Bait'}
                                        </div>
                                        <div className="text-lg font-bold text-white">
                                            {fish.bait}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Method Box */}
                            {fish.method && (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <Anchor size={24} className="text-blue-400" />
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
                                            {dict.method || 'Method'}
                                        </div>
                                        <div className="text-lg font-bold text-white">
                                            {fish.method}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Depth and Water Temp */}
                    {(depth || waterTemp) && (
                        <div className="grid grid-cols-2 gap-3">
                            {depth && (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <Droplets size={24} className="text-cyan-400" />
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
                                            {dict.depth || 'Depth'}
                                        </div>
                                        <div className="text-lg font-bold text-white">
                                            {depth} {dict.meters || 'm'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {waterTemp && (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <Thermometer size={24} className="text-orange-400" />
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
                                            {dict.waterTemp || 'Water Temp'}
                                        </div>
                                        <div className="text-lg font-bold text-white">
                                            {waterTemp}{dict.celsius || '°C'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Weather - Displayed like map widget */}
                    {parsedWeather && (
                        <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Cloud size={18} className="text-blue-400" />
                                <span className="text-sm font-semibold text-white">{dict.weather || 'Weather'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {parsedWeather.temperature !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <Thermometer size={18} className="text-red-400" />
                                        <div>
                                            <div className="text-xs text-zinc-400">{dict.temperature || 'Temp'}</div>
                                            <div className="text-lg font-bold text-white">{parsedWeather.temperature}°C</div>
                                        </div>
                                    </div>
                                )}

                                {parsedWeather.windSpeed !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <Wind size={18} className="text-cyan-400" />
                                        <div>
                                            <div className="text-xs text-zinc-400">{dict.wind || 'Wind'}</div>
                                            <div className="text-lg font-bold text-white">
                                                {parsedWeather.windSpeed} km/h {parsedWeather.windDirection || ''}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {parsedWeather.humidity !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <Droplets size={18} className="text-blue-400" />
                                        <div>
                                            <div className="text-xs text-zinc-400">{dict.humidity || 'Humidity'}</div>
                                            <div className="text-lg font-bold text-white">{parsedWeather.humidity}%</div>
                                        </div>
                                    </div>
                                )}

                                {parsedWeather.pressure !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <Gauge size={18} className="text-purple-400" />
                                        <div>
                                            <div className="text-xs text-zinc-400">{dict.pressure || 'Pressure'}</div>
                                            <div className="text-lg font-bold text-white">{parsedWeather.pressure} hPa</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};



