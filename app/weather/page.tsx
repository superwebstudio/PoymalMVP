"use client";

import React, { useEffect, useRef } from 'react';
import { CloudSun, Sun } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useI18n } from '@/lib/useI18n';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { BiteForecastCard } from '@/components/map/weather/BiteForecastCard';
import { WeatherSummaryGrid } from '@/components/map/weather/WeatherSummaryGrid';
import { MarineConditions } from '@/components/map/weather/MarineConditions';
import { TideChart } from '@/components/map/weather/TideChart';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { useRouter, useSearchParams } from 'next/navigation';

function WeatherPageContent() {
  const { dict } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = React.useState(false);

  // Handle hydration - only read params after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const lat = mounted && searchParams ? searchParams.get('lat') : null;
  const lng = mounted && searchParams ? searchParams.get('lng') : null;
  const locationNameFromUrl = mounted && searchParams ? searchParams.get('name') : null;

  const {
    weatherData,
    marineData,
    solunarData,
    tideData,
    loading,
    error,
    locationName,
    expandedSections,
    toggleSection,
    isCoastal,
    fetchBasicInfo,
    fetchWeatherData,
  } = useWeatherStore();

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevSections = useRef<Set<string>>(expandedSections);
  const hasFetchedRef = useRef(false);

  // Fetch weather data when lat/lng are available
  useEffect(() => {
    if (lat && lng && !hasFetchedRef.current) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        hasFetchedRef.current = true;
        fetchBasicInfo(latitude, longitude);
        fetchWeatherData(latitude, longitude);
      }
    }
  }, [lat, lng, fetchBasicInfo, fetchWeatherData]);

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

  // Display location name from URL if available, otherwise use the one from store
  const displayLocationName = locationNameFromUrl || locationName || (lat && lng ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` : 'Unknown Location');

  const getWeatherIcon = () => (weatherData ? <Sun size={16} /> : <CloudSun size={16} />);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
      <TelegramBackButton onClick={handleBack} />

      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-1">
          {getWeatherIcon()}
          <h1 className="text-xl font-bold text-white">{dict.weather || 'Weather'}</h1>
        </div>
        {displayLocationName && (
          <p className="text-sm text-zinc-400">{displayLocationName}</p>
        )}
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center py-8 bg-red-500/10 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        {!loading && !error && weatherData && (
          <div className="space-y-4 pb-8">
            {solunarData && (
              <BiteForecastCard
                dict={dict}
                solunarData={solunarData}
                weatherData={weatherData}
              />
            )}

            <WeatherSummaryGrid dict={dict} weatherData={weatherData} />

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

            {tideData && isCoastal && (
              <div ref={(el) => { sectionRefs.current['tide'] = el; }}>
                <TideChart
                  dict={dict}
                  data={tideData}
                  isOpen={expandedSections.has('tide')}
                  onToggle={toggleSection}
                />
              </div>
            )}
          </div>
        )}

        {!loading && !error && !weatherData && (
          <div className="text-center py-12 text-zinc-400">
            {(dict as any).noWeatherData || 'No weather data available'}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function WeatherPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          Loading...
        </div>
      }
    >
      <WeatherPageContent />
    </React.Suspense>
  );
}
