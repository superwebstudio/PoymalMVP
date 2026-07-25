"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Share2, Star, Cloud } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useMapStore } from '@/stores/useMapStore';
import { useUserStore } from '@/stores/useUserStore';
import { useSavedLocationsStore } from '@/stores/useSavedLocationsStore';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { WeatherModal } from './weather/WeatherModal';

export function DroppedPinSheet() {
    const { dict } = useI18n();
    const { userId } = useUserStore();
    const { createLocation, deleteLocation, locations, loading: isCreating } = useSavedLocationsStore();
    const { addNotification } = useNotificationStore();
    const {
        droppedPin,
        showDroppedPinSheet,
        closeDroppedPinSheet,
        setDroppedPin,
    } = useMapStore();
    const {
        isExpanded,
        toggleExpanded,
        fetchBasicInfo,
        fetchWeatherData,
        weatherData,
    } = useWeatherStore();

    const handleShare = () => {
        if (!droppedPin) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${droppedPin.lat},${droppedPin.lng}`;
        if (navigator.share) {
            navigator.share({
                title: 'Dropped Pin',
                text: `Check out this location: ${droppedPin.lat.toFixed(6)}, ${droppedPin.lng.toFixed(6)}`,
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            // You might want to show a toast here
        }
    };

    // Check if current dropped pin is already saved
    const isSaved = droppedPin ? locations.some(loc =>
        Math.abs(loc.latitude - droppedPin.lat) < 0.0001 &&
        Math.abs(loc.longitude - droppedPin.lng) < 0.0001
    ) : false;

    const handleSave = async () => {
        if (!userId || !droppedPin) return;

        if (isSaved) {
            // Remove if already saved
            const savedLocation = locations.find(loc =>
                Math.abs(loc.latitude - droppedPin.lat) < 0.0001 &&
                Math.abs(loc.longitude - droppedPin.lng) < 0.0001
            );
            if (savedLocation) {
                try {
                    await deleteLocation({ id: savedLocation.id });
                    addNotification({
                        message: dict.locationRemoved || 'Location removed',
                        type: 'success',
                    });
                } catch (error) {
                    addNotification({
                        message: dict.locationRemoveFailed || 'Failed to remove location',
                        type: 'error',
                    });
                }
            }
        } else {
            // Save new location
            try {
                await createLocation({
                    name: dict.savedLocation || 'Saved Location',
                    latitude: droppedPin.lat,
                    longitude: droppedPin.lng,
                });
                addNotification({
                    message: dict.locationSaved || 'Location saved',
                    type: 'success',
                });
                // Clear dropped pin after saving (it will now show as saved location marker)
                closeDroppedPinSheet();
                setDroppedPin(null);
            } catch (error) {
                const message =
                    error instanceof Error && error.message
                        ? error.message
                        : dict.locationSaveFailed || 'Failed to save location';
                addNotification({
                    message:
                        message === 'Name is required'
                            ? dict.locationSaveFailed || 'Failed to save location'
                            : message,
                    type: 'error',
                });
            }
        }
    };

    const handleCheckWeather = () => {
        if (droppedPin) {
            // Fetch weather specifically for dropped pin location
            fetchBasicInfo(droppedPin.lat, droppedPin.lng);
            fetchWeatherData(droppedPin.lat, droppedPin.lng);
            toggleExpanded();
        }
    };

    const getWeatherIcon = () => (weatherData ? <Cloud size={18} /> : <Cloud size={18} />);

    return (
        <AnimatePresence mode="wait">
            {showDroppedPinSheet && droppedPin && (
                <motion.div
                    key="dropped-pin-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.6 }}
                    className="fixed inset-x-0 bottom-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 rounded-t-2xl z-[110] max-h-[50vh]"
                    style={{
                        paddingBottom: 'max(20px, calc(20px + env(safe-area-inset-bottom)))',
                        backgroundColor: 'rgba(24, 24, 27, 0.75)',
                    }}
                >
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-200">
                                Dropped Pin
                            </h3>
                            <button
                                onClick={closeDroppedPinSheet}
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-4">
                            <div className="flex items-center gap-3 text-zinc-300">
                                <MapPin size={18} className="text-red-500" />
                                <div className="flex flex-col flex-1">
                                    <span className="text-sm font-mono">
                                        {droppedPin.lat.toFixed(6)}, {droppedPin.lng.toFixed(6)}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        Coordinates
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCheckWeather}
                                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title={dict.checkWeatherHere || "Check Weather Here"}
                                    >
                                        <Cloud size={18} />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                        title={dict.share || "Share"}
                                    >
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleSave}
                                disabled={isCreating}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 ${isSaved
                                    ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                                    }`}
                            >
                                {isCreating ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Star size={18} className={isSaved ? 'fill-yellow-500 text-yellow-500' : ''} />
                                        <span>{isSaved ? (dict.remove || "Remove") : (dict.save || "Save")}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Weather Modal */}
            {droppedPin && (
                <WeatherModal
                    dict={dict}
                    isBottomSheetOpen={showDroppedPinSheet}
                    getWeatherIcon={getWeatherIcon}
                />
            )}
        </AnimatePresence>
    );
}

