"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Share2, Pencil, Check, Cloud, ChevronLeft } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useMapStore } from '@/stores/useMapStore';
import { useUserStore } from '@/stores/useUserStore';
import { useSavedLocationsStore } from '@/stores/useSavedLocationsStore';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { WeatherSummaryGrid } from './weather/WeatherSummaryGrid';
import { MarineConditions } from './weather/MarineConditions';
import { TideChart } from './weather/TideChart';
import { BiteForecastCard } from './weather/BiteForecastCard';

export function SavedLocationSheet() {
    const { dict } = useI18n();
    const { userId } = useUserStore();
    const { renameLocation } = useSavedLocationsStore();
    const {
        weatherData,
        marineData,
        solunarData,
        tideData,
        loading: weatherLoading,
        error: weatherError,
        fetchBasicInfo,
        fetchWeatherData,
        expandedSections,
        toggleSection,
        isCoastal
    } = useWeatherStore();
    const { addNotification } = useNotificationStore();

    const {
        selectedSavedLocation,
        showSavedLocationSheet,
        setShowSavedLocationSheet,
        setSelectedSavedLocation,
        openSavedLocationWeatherView,
        setOpenSavedLocationWeatherView,
    } = useMapStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [view, setView] = useState<'details' | 'weather'>('details');

    React.useEffect(() => {
        if (selectedSavedLocation) {
            setEditName(selectedSavedLocation.name || '');
            // If weather view flag is set, open weather view, otherwise reset to details
            if (openSavedLocationWeatherView) {
                setView('weather');
                fetchBasicInfo(selectedSavedLocation.latitude, selectedSavedLocation.longitude);
                fetchWeatherData(selectedSavedLocation.latitude, selectedSavedLocation.longitude);
                setOpenSavedLocationWeatherView(false); // Reset flag
            } else {
                setView('details');
            }
        }
    }, [selectedSavedLocation, openSavedLocationWeatherView, fetchBasicInfo, fetchWeatherData, setOpenSavedLocationWeatherView]);

    const handleClose = () => {
        setShowSavedLocationSheet(false);
        setIsEditing(false);
        setView('details');
        setTimeout(() => {
            setSelectedSavedLocation(null);
        }, 300);
    };

    const handleSaveEdit = async () => {
        if (selectedSavedLocation && userId) {
            if (selectedSavedLocation.id.toString().startsWith('temp-')) {
                addNotification({ message: 'Syncing...', type: 'info' });
                return;
            }
            try {
                await renameLocation({ id: selectedSavedLocation.id, name: editName });
                // Update the selected location in the map store to reflect the change immediately
                setSelectedSavedLocation({ ...selectedSavedLocation, name: editName });
                setIsEditing(false);
                addNotification({ message: 'Location updated', type: 'success' });
            } catch (error) {
                addNotification({ message: 'Failed to rename', type: 'error' });
            }
        }
    };


    const handleWeatherClick = () => {
        if (selectedSavedLocation) {
            setView('weather');
            fetchBasicInfo(selectedSavedLocation.latitude, selectedSavedLocation.longitude);
            fetchWeatherData(selectedSavedLocation.latitude, selectedSavedLocation.longitude);
        }
    };

    const handleShare = () => {
        if (!selectedSavedLocation) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${selectedSavedLocation.latitude},${selectedSavedLocation.longitude}`;
        if (navigator.share) {
            navigator.share({
                title: selectedSavedLocation.name || 'Saved Location',
                text: `Check out this location: ${selectedSavedLocation.latitude.toFixed(6)}, ${selectedSavedLocation.longitude.toFixed(6)}`,
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    if (!selectedSavedLocation) return null;

    return (
        <AnimatePresence mode="wait">
            {showSavedLocationSheet && (
                <motion.div
                    key="saved-location-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.6 }}
                    layout
                    className={view === 'weather'
                        ? "fixed inset-x-0 bottom-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 rounded-t-2xl z-[110] h-[85vh] flex flex-col"
                        : "fixed inset-x-0 bottom-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 rounded-t-2xl z-[110] max-h-[40vh] flex flex-col"
                    }
                    style={{
                        paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))',
                        backgroundColor: 'rgba(24, 24, 27, 0.75)',
                    }}
                >
                    <div className="p-4 h-full flex flex-col">
                        {view === 'weather' ? (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                    <button
                                        onClick={() => setView('details')}
                                        className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <h3 className="text-lg font-bold text-zinc-200">
                                        {dict.weather || "Weather"}
                                    </h3>
                                    <button
                                        onClick={handleClose}
                                        className="p-2 -mr-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto min-h-0">
                                    {weatherLoading && (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}

                                    {!weatherLoading && weatherData && (
                                        <div className="space-y-3 pb-8">
                                            {solunarData && (
                                                <BiteForecastCard
                                                    dict={dict}
                                                    solunarData={solunarData}
                                                    weatherData={weatherData}
                                                />
                                            )}

                                            <WeatherSummaryGrid dict={dict} weatherData={weatherData} />

                                            {marineData && (
                                                <MarineConditions
                                                    dict={dict}
                                                    data={marineData}
                                                    isOpen={expandedSections.has('marine')}
                                                    onToggle={toggleSection}
                                                />
                                            )}

                                            {tideData && isCoastal && (
                                                <TideChart
                                                    dict={dict}
                                                    data={tideData}
                                                    isOpen={expandedSections.has('tide')}
                                                    onToggle={toggleSection}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-zinc-200">
                                        {dict.savedLocation || "Saved Location"}
                                    </h3>
                                    <button
                                        onClick={handleClose}
                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-4">
                                    {/* Name Section */}
                                    <div className="flex items-center gap-3">
                                        <MapPin size={18} className="text-blue-500" />
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleSaveEdit();
                                                            } else if (e.key === 'Escape') {
                                                                setIsEditing(false);
                                                                setEditName(selectedSavedLocation.name || '');
                                                            }
                                                        }}
                                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none "
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-zinc-200 flex-1 text-sm">
                                                        {selectedSavedLocation.name || `${selectedSavedLocation.latitude.toFixed(4)}, ${selectedSavedLocation.longitude.toFixed(4)}`}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={handleWeatherClick}
                                                            className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            title={dict.weather || "Weather"}
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
                                                        <button
                                                            onClick={() => setIsEditing(true)}
                                                            className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors relative z-[115]"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <span className="text-xs text-zinc-500 mt-0.5 block">
                                                {selectedSavedLocation.latitude.toFixed(6)}, {selectedSavedLocation.longitude.toFixed(6)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
    );
}
