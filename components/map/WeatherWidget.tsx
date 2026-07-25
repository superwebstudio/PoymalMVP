"use client";

import React, { useEffect, useMemo } from 'react';
import { Cloud, Sun } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useMapStore } from '@/stores/useMapStore';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { WeatherButton } from './weather/WeatherButton';
import { WeatherModal } from './weather/WeatherModal';

interface WeatherWidgetProps {
    latitude: number;
    longitude: number;
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
    const { dict } = useI18n();
    const { 
        showBottomSheet, 
        showDroppedPinSheet, 
        showSavedLocationSheet, 
        showSavedLocationsView,
        showNearbySheet,
        setShowBottomSheet,
        setShowDroppedPinSheet,
        setShowSavedLocationSheet,
        setShowSavedLocationsView,
        setShowNearbySheet,
        closeDroppedPinSheet,
        closeCatchDetailsSheet,
    } = useMapStore();
    const isBottomSheetOpen = showBottomSheet || showDroppedPinSheet || showSavedLocationSheet || showSavedLocationsView || showNearbySheet;

    const {
        isExpanded,
        toggleExpanded,
        fetchBasicInfo,
        fetchWeatherData,
        weatherData,
    } = useWeatherStore();

    // Close all open sheets before opening weather widget
    const handleToggleWeather = () => {
        if (isBottomSheetOpen) {
            // Close all sheets first
            if (showBottomSheet) {
                closeCatchDetailsSheet();
            }
            if (showDroppedPinSheet) {
                closeDroppedPinSheet();
            }
            if (showSavedLocationSheet) {
                setShowSavedLocationSheet(false);
            }
            if (showSavedLocationsView) {
                setShowSavedLocationsView(false);
            }
            if (showNearbySheet) {
                setShowNearbySheet(false);
            }
            // Small delay to allow sheets to close before opening weather
            setTimeout(() => {
                toggleExpanded();
            }, 100);
        } else {
            toggleExpanded();
        }
    };

    // Always fetch weather for the widget's location (user's current location)
    // This ensures the widget always shows current location weather, not dropped pin weather
    useEffect(() => {
        if (latitude && longitude) {
            // Only fetch if no other sheet is fetching weather (to avoid conflicts)
            // But always ensure widget shows its own location weather
            fetchBasicInfo(latitude, longitude);
        }
    }, [latitude, longitude, fetchBasicInfo]);

    useEffect(() => {
        if (isExpanded && latitude && longitude) {
            // Always fetch for widget's own location when expanded
            // This ensures widget always shows current location weather, not dropped pin weather
            fetchBasicInfo(latitude, longitude);
            fetchWeatherData(latitude, longitude);
        }
    }, [isExpanded, latitude, longitude, fetchBasicInfo, fetchWeatherData]);

    const getWeatherIcon = useMemo(() => {
        return () => (weatherData ? <Sun size={16} /> : <Cloud size={16} />);
    }, [weatherData]);

    return (
        <>
            <WeatherButton isBottomSheetOpen={isBottomSheetOpen} onToggle={handleToggleWeather} />
            <WeatherModal
                dict={dict}
                isBottomSheetOpen={isBottomSheetOpen}
                getWeatherIcon={getWeatherIcon}
            />
        </>
    );
}

