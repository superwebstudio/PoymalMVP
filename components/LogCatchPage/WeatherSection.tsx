"use client";

import React, { useEffect, useRef } from "react";
import { useWeatherStore } from "@/stores/useWeatherStore";
import { WeatherSummaryGrid } from "../map/weather/WeatherSummaryGrid";
import { MarineConditions } from "../map/weather/MarineConditions";

interface WeatherSectionProps {
  dict: Record<string, string>;
  includeWeather: boolean;
  location: string | undefined;
  latitude: number | null;
  longitude: number | null;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({
  dict,
  includeWeather,
  location,
  latitude,
  longitude,
}) => {
  const {
    weatherData,
    marineData,
    loading,
    error,
    expandedSections,
    toggleSection,
    fetchBasicInfo,
    fetchWeatherData,
    setExpanded,
  } = useWeatherStore();

  const hasFetchedRef = useRef(false);
  const hasLocationName = !!(location?.trim());
  const hasCoordinates = !!(latitude && longitude);

  useEffect(() => {
    setExpanded(false);
  }, [setExpanded]);

  useEffect(() => {
    if (!includeWeather) {
      hasFetchedRef.current = false;
      return;
    }

    if (!hasCoordinates || latitude == null || longitude == null) {
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchBasicInfo(latitude, longitude);
    fetchWeatherData(latitude, longitude);
  }, [
    includeWeather,
    hasCoordinates,
    latitude,
    longitude,
    fetchBasicInfo,
    fetchWeatherData,
  ]);

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [latitude, longitude]);

  if (!includeWeather) {
    return null;
  }

  return (
    <div className="space-y-3">
      {!hasCoordinates && (
        <p className="text-xs text-amber-400">
          {hasLocationName
            ? dict.useLocationButtonForWeather ||
              "Please set a map location to load weather"
            : dict.provideLocationForWeather ||
              "Please provide a location to see weather information"}
        </p>
      )}

      {loading && hasCoordinates && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      )}

      {error && hasCoordinates && (
        <p className="text-center text-xs text-red-400">{error}</p>
      )}

      {!loading && !error && weatherData && hasCoordinates && (
        <>
          <WeatherSummaryGrid dict={dict} weatherData={weatherData} />
          {marineData && (
            <MarineConditions
              dict={dict}
              data={marineData}
              isOpen={expandedSections.has("marine")}
              onToggle={toggleSection}
            />
          )}
        </>
      )}
    </div>
  );
};
