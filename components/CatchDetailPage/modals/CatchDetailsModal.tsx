"use client";

import React, { useEffect, useRef } from 'react';
import { Sheet } from 'react-modal-sheet';
import { X, Droplets, Thermometer, Cloud, Sun } from 'lucide-react';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { WeatherSummaryGrid } from '../../map/weather/WeatherSummaryGrid';
import { MarineConditions } from '../../map/weather/MarineConditions';

interface CatchDetailsModalProps {
    catchData: any;
    isOpen: boolean;
    onClose: () => void;
    dict: any;
}

export const CatchDetailsModal: React.FC<CatchDetailsModalProps> = ({
    catchData,
    isOpen,
    onClose,
    dict,
}) => {
    if (!catchData) return null;

    const {
        weatherData,
        marineData,
        loading: weatherLoading,
        error: weatherError,
        locationName: weatherLocationName,
        expandedSections,
        toggleSection,
        fetchBasicInfo,
        fetchWeatherData,
    } = useWeatherStore();

    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const prevSections = useRef<Set<string>>(expandedSections);
    const hasFetchedRef = useRef(false);

    // Check if we have stored weather data from catch creation
    const storedWeatherData = catchData.weatherData as any;
    const hasStoredWeather = !!(storedWeatherData && (storedWeatherData.weather || storedWeatherData.marine || storedWeatherData.solunar));
    // Check if weatherData field exists (even if null/empty) - indicates weather switch was enabled
    const weatherWasEnabled = catchData.weatherData !== undefined && catchData.weatherData !== null;
    // Check if weather was enabled but no coordinates were available
    const weatherEnabledButNoCoordinates = weatherWasEnabled && storedWeatherData?.noCoordinates === true;

    // If no stored weather, check if we have coordinates to fetch current weather
    const lat = catchData.latitude != null ? Number(catchData.latitude) : null;
    const lng = catchData.longitude != null ? Number(catchData.longitude) : null;
    const hasCoordinates = !!(lat != null && lng != null && !isNaN(lat) && !isNaN(lng));

    // Load stored weather data into store when modal opens
    useEffect(() => {
        if (isOpen && hasStoredWeather && storedWeatherData) {
            // Set stored weather data in the store for display
            useWeatherStore.setState({
                weatherData: storedWeatherData.weather || null,
                marineData: storedWeatherData.marine || null,
                locationName: storedWeatherData.locationName || catchData.location || null,
                currentTemp: storedWeatherData.weather?.temperature || null,
                loading: false,
                error: null,
            });
        } else if (isOpen && !hasStoredWeather && hasCoordinates && lat != null && lng != null && !hasFetchedRef.current) {
            // Only fetch current weather if no stored weather exists
            hasFetchedRef.current = true;
            fetchBasicInfo(lat, lng);
            fetchWeatherData(lat, lng);
        }
    }, [isOpen, hasStoredWeather, storedWeatherData, hasCoordinates, lat, lng, catchData.location, fetchBasicInfo, fetchWeatherData]);

    // Reset fetch flag when modal closes
    useEffect(() => {
        if (!isOpen) {
            hasFetchedRef.current = false;
        }
    }, [isOpen]);

    // Handle section scrolling
    useEffect(() => {
        const newlyOpened = Array.from(expandedSections).find((section) => !prevSections.current.has(section));
        if (newlyOpened) {
            const sectionElement = sectionRefs.current[newlyOpened];
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
        prevSections.current = new Set(expandedSections);
    }, [expandedSections]);

    const getWeatherIcon = () => (weatherData ? <Sun size={16} /> : <Cloud size={16} />);
    const displayLocationName = catchData.location || weatherLocationName || 
        (hasCoordinates && lat != null && lng != null ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : null);

    // Use larger snap points if weather data is available (stored or loading)
    const hasWeatherData = !!(weatherData || weatherLoading || hasStoredWeather || marineData);
    const snapPoints = hasWeatherData ? [0, 0.5, 0.85, 1] : [0, 0.4, 1];
    const initialSnap = hasWeatherData ? 2 : 1; // Open to 85% with weather, 40% without

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            snapPoints={snapPoints}
            initialSnap={initialSnap}
        >
            <Sheet.Container
                style={{
                    backgroundColor: '#18181b', // zinc-900
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    borderColor: 'rgb(39, 39, 42)', // zinc-800
                    borderWidth: '1px 1px 0 1px',
                }}
            >
                <Sheet.Header>
                    <div className="flex justify-center py-3">
                        <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between px-4 pb-2">
                        <h3 className="text-lg font-bold text-zinc-100">
                            {dict.catchConditions || 'Catch Conditions'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </Sheet.Header>

                <Sheet.Content className="p-4 space-y-4 overflow-y-auto">
                    <div className="space-y-4">
                        {(catchData.depth != null || catchData.waterTemp != null) && (
                            <div className={`grid gap-4 ${catchData.depth != null && catchData.waterTemp != null ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {catchData.depth != null && (
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                                        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-medium">
                                            <Droplets size={14} className="text-cyan-400" />
                                            <span>{dict.depth || "Depth"}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-zinc-100">
                                            {catchData.depth} {dict.meters || "m"}
                                        </div>
                                    </div>
                                )}

                                {catchData.waterTemp != null && (
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                                        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-medium">
                                            <Thermometer size={14} className="text-orange-400" />
                                            <span>{dict.waterTemp || "Water Temp"}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-zinc-100">
                                            {catchData.waterTemp}{dict.celsius || "°C"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Weather Section */}
                        {hasStoredWeather ? (
                            // Show stored weather from catch creation
                            <div className="space-y-3 pt-2 border-t border-zinc-800">
                                <div className="flex items-center gap-2 mb-2">
                                    {getWeatherIcon()}
                                    <h4 className="text-sm font-semibold text-zinc-200">{dict.weather || 'Weather'}</h4>
                                    {storedWeatherData?.fetchedAt && (
                                        <span className="text-xs text-zinc-500 ml-auto">
                                            {(dict as any).atTimeOfCatch || 'At time of catch'}
                                        </span>
                                    )}
                                </div>
                                {displayLocationName && (
                                    <p className="text-xs text-zinc-400 mb-3">{displayLocationName}</p>
                                )}

                                {(weatherData || marineData) && (
                                    <div className="space-y-3">
                                        {weatherData && (
                                            <WeatherSummaryGrid dict={dict} weatherData={weatherData} />
                                        )}

                                        {marineData && (
                                            <div ref={(el) => { sectionRefs.current['marine'] = el; }}>
                                                <MarineConditions
                                                    dict={dict}
                                                    data={marineData}
                                                    isOpen={expandedSections.has('marine')}
                                                    onToggle={toggleSection}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : hasCoordinates ? (
                            // Fetch current weather if coordinates available but no stored weather
                            <div className="space-y-3 pt-2 border-t border-zinc-800">
                                <div className="flex items-center gap-2 mb-2">
                                    {getWeatherIcon()}
                                    <h4 className="text-sm font-semibold text-zinc-200">{dict.weather || 'Weather'}</h4>
                                </div>
                                {displayLocationName && (
                                    <p className="text-xs text-zinc-400 mb-3">{displayLocationName}</p>
                                )}

                                {weatherLoading && (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}

                                {weatherError && (
                                    <div className="text-red-400 text-xs text-center py-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                        {weatherError}
                                    </div>
                                )}

                                {!weatherLoading && !weatherError && (weatherData || marineData) && (
                                    <div className="space-y-3">
                                        {weatherData && (
                                            <WeatherSummaryGrid dict={dict} weatherData={weatherData} />
                                        )}

                                        {marineData && (
                                            <div ref={(el) => { sectionRefs.current['marine'] = el; }}>
                                                <MarineConditions
                                                    dict={dict}
                                                    data={marineData}
                                                    isOpen={expandedSections.has('marine')}
                                                    onToggle={toggleSection}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!weatherLoading && !weatherError && !weatherData && (
                                    <div className="text-yellow-400 text-xs text-center py-3">
                                        {dict.loadingWeather || 'Loading weather data...'}
                                    </div>
                                )}
                            </div>
                        ) : weatherEnabledButNoCoordinates ? (
                            // Weather switch was enabled but no coordinates were available at catch time
                            <div className="pt-2 border-t border-zinc-800">
                                <div className="text-xs text-yellow-400 text-center py-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                    {(dict as any).weatherEnabledButNoCoordinates || 'Weather was enabled but location coordinates were not available at catch time'}
                                </div>
                            </div>
                        ) : weatherWasEnabled && !hasStoredWeather ? (
                            // Weather switch was enabled but weather fetch failed
                            <div className="pt-2 border-t border-zinc-800">
                                <div className="text-xs text-yellow-400 text-center py-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                    {(dict as any).weatherFetchFailed || 'Weather was enabled but could not be fetched at catch time'}
                                </div>
                            </div>
                        ) : (
                            <div className="pt-2 border-t border-zinc-800">
                                <div className="text-xs text-zinc-500 text-center py-3">
                                    {dict.noLocationForWeather || 'No location coordinates available for weather'}
                                </div>
                            </div>
                        )}
                    </div>
                </Sheet.Content>
            </Sheet.Container>
            <Sheet.Backdrop onTap={onClose} />
        </Sheet>
    );
};
