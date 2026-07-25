"use client";

import { create } from 'zustand';

export interface WeatherData {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    humidity: number;
}

export interface DailyWeatherData {
    date: string; // ISO date string (YYYY-MM-DD)
    hourly: {
        time: string[];
        temperature: number[];
        windSpeed: number[];
        windDirection: number[];
        pressure: number[];
        humidity: number[];
    };
}

export interface MarineData {
    waveHeight: number;
    waveDirection: number;
    waterTemperature: number | null;
}

export interface DailyMarineData {
    date: string; // ISO date string (YYYY-MM-DD)
    hourly: {
        time: string[];
        waveHeight: number[];
        waveDirection: number[];
        waterTemperature: number[];
    };
}

export interface SolunarData {
    sunrise: string;
    sunset: string;
    moonPhase: string;
    moonRise: string;
    moonSet: string;
    majorPeriods: Array<{ start: string; end: string; type: 'major' | 'minor' }>;
    biteRating: number;
}

export interface TideData {
    times: Array<{ time: string; height: number; type: 'high' | 'low' }>;
    nextHigh: { time: string; height: number };
    nextLow: { time: string; height: number };
}

interface WeatherState {
    isExpanded: boolean;
    weatherData: WeatherData | null;
    marineData: MarineData | null;
    solunarData: SolunarData | null;
    tideData: TideData | null;
    loading: boolean;
    error: string | null;
    currentTemp: number | null;
    locationName: string | null;
    isCoastal: boolean;
    expandedSections: Set<string>;
    // Multi-day forecast data
    dailyWeatherData: DailyWeatherData[];
    dailyMarineData: DailyMarineData[];
    selectedDay: number; // 0 = today, 1 = tomorrow, etc.
    currentLat: number | null;
    currentLng: number | null;
    setSelectedDay: (day: number) => void;
    getWeatherForDay: (dayIndex: number) => WeatherData | null;
    getMarineForDay: (dayIndex: number) => MarineData | null;
    getSolunarForDay: (dayIndex: number) => SolunarData | null;
    toggleExpanded: () => void;
    setExpanded: (value: boolean) => void;
    toggleSection: (section: string) => void;
    fetchBasicInfo: (lat: number, lng: number) => Promise<void>;
    fetchWeatherData: (lat: number, lng: number) => Promise<void>;
    reset: () => void;
}

const INITIAL_SECTIONS = new Set<string>(['bite']);

export const useWeatherStore = create<WeatherState>((set, get) => ({
    isExpanded: false,
    weatherData: null,
    marineData: null,
    solunarData: null,
    tideData: null,
    loading: false,
    error: null,
    currentTemp: null,
    locationName: null,
    isCoastal: false,
    expandedSections: INITIAL_SECTIONS,
    dailyWeatherData: [],
    dailyMarineData: [],
    selectedDay: 0,
    currentLat: null,
    currentLng: null,

    toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

    setExpanded: (value: boolean) => set({ isExpanded: value }),

    toggleSection: (section: string) =>
        set((state) => {
            const sections = new Set(state.expandedSections);
            if (sections.has(section)) {
                sections.delete(section);
            } else {
                sections.add(section);
            }
            return { expandedSections: sections };
        }),

    setSelectedDay: (day: number) => set({ selectedDay: day }),

    getWeatherForDay: (dayIndex: number) => {
        const state = get();
        if (dayIndex === 0 && state.weatherData) {
            return state.weatherData;
        }
        const dailyData = state.dailyWeatherData[dayIndex];
        if (!dailyData || !dailyData.hourly.time.length) return null;
        
        // Get average or representative values for the day
        const temps = dailyData.hourly.temperature;
        const windSpeeds = dailyData.hourly.windSpeed;
        const windDirs = dailyData.hourly.windDirection;
        const pressures = dailyData.hourly.pressure;
        const humidities = dailyData.hourly.humidity;
        
        return {
            temperature: temps.length > 0 ? temps[Math.floor(temps.length / 2)] : 0,
            windSpeed: windSpeeds.length > 0 ? windSpeeds[Math.floor(windSpeeds.length / 2)] : 0,
            windDirection: windDirs.length > 0 ? windDirs[Math.floor(windDirs.length / 2)] : 0,
            pressure: pressures.length > 0 ? pressures[Math.floor(pressures.length / 2)] : 0,
            humidity: humidities.length > 0 ? humidities[Math.floor(humidities.length / 2)] : 0,
        };
    },

    getMarineForDay: (dayIndex: number) => {
        const state = get();
        if (dayIndex === 0 && state.marineData) {
            return state.marineData;
        }
        const dailyData = state.dailyMarineData[dayIndex];
        if (!dailyData || !dailyData.hourly.time.length) return null;
        
        const waveHeights = dailyData.hourly.waveHeight;
        const waveDirs = dailyData.hourly.waveDirection;
        const waterTemps = dailyData.hourly.waterTemperature;
        
        return {
            waveHeight: waveHeights.length > 0 ? waveHeights[Math.floor(waveHeights.length / 2)] : 0,
            waveDirection: waveDirs.length > 0 ? waveDirs[Math.floor(waveDirs.length / 2)] : 0,
            waterTemperature: waterTemps.length > 0 ? waterTemps[Math.floor(waterTemps.length / 2)] : null,
        };
    },

    getSolunarForDay: (dayIndex: number) => {
        const state = get();
        if (dayIndex === 0 && state.solunarData) {
            return state.solunarData;
        }
        // For future days, calculate solunar data for that specific date
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayIndex);
        
        // Use stored coordinates or default to 0,0
        const lat = state.currentLat ?? 0;
        const lng = state.currentLng ?? 0;
        return calculateSolunarDataForDate(targetDate, lat, lng);
    },

    fetchBasicInfo: async (lat: number, lng: number) => {
        try {
            const tempUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m&timezone=auto&forecast_days=1`;
            const tempResponse = await fetch(tempUrl);
            if (tempResponse.ok) {
                const data = await tempResponse.json();
                if (data.hourly && data.hourly.time && data.hourly.temperature_2m) {
                    const now = new Date();
                    const currentHourISO = now.toISOString().slice(0, 13) + ':00';
                    let index = data.hourly.time.findIndex((t: string) => t >= currentHourISO);
                    if (index === -1) index = 0;
                    if (data.hourly.temperature_2m[index] !== undefined) {
                        set({ currentTemp: Math.round(data.hourly.temperature_2m[index]) });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching temperature:', error);
            // Non-critical error, continue
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { 
                    headers: { 'User-Agent': 'Ulov Fishing App' },
                    signal: controller.signal
                }
            );
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data && data.address) {
                    const address = data.address;
                    const name =
                        address.village ||
                        address.town ||
                        address.city ||
                        address.county ||
                        address.state ||
                        `${address.road || ''} ${address.house_number || ''}`.trim() ||
                        `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    set({ locationName: name });
                } else {
                    set({ locationName: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
                }
            } else {
                set({ locationName: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
            }
        } catch (error) {
            console.error('Error fetching location name:', error);
            set({ locationName: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        }
    },

    fetchWeatherData: async (lat: number, lng: number) => {
        set({ loading: true, error: null, currentLat: lat, currentLng: lng });

        try {
            // Fetch 7 days of forecast data
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,pressure_msl,relative_humidity_2m&timezone=auto&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,pressure_msl&forecast_days=7`;
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) {
                const errorText = await weatherResponse.text();
                throw new Error(`Failed to fetch weather data: ${weatherResponse.status} ${weatherResponse.statusText} - ${errorText}`);
            }
            const weatherJson = await weatherResponse.json();
            
            if (!weatherJson.current || !weatherJson.hourly) {
                throw new Error('Invalid weather data format received');
            }

            const now = new Date();
            const currentHourISO = now.toISOString().slice(0, 13) + ':00';
            let currentIndex = weatherJson.hourly.time.findIndex((t: string) => t >= currentHourISO);
            if (currentIndex === -1) currentIndex = 0;

            // Set current weather data
            const currentWeather: WeatherData = {
                temperature: weatherJson.current.temperature_2m,
                windSpeed: weatherJson.current.wind_speed_10m,
                windDirection: weatherJson.current.wind_direction_10m,
                pressure: weatherJson.current.pressure_msl,
                humidity: weatherJson.current.relative_humidity_2m,
            };

            // Process hourly data into daily chunks
            const dailyWeatherData: DailyWeatherData[] = [];
            const times = weatherJson.hourly.time;
            const temps = weatherJson.hourly.temperature_2m;
            const windSpeeds = weatherJson.hourly.wind_speed_10m;
            const windDirs = weatherJson.hourly.wind_direction_10m;
            const pressures = weatherJson.hourly.pressure_msl;
            const humidities = weatherJson.hourly.relative_humidity_2m;

            // Group hourly data by date
            const dailyMap = new Map<string, {
                time: string[];
                temperature: number[];
                windSpeed: number[];
                windDirection: number[];
                pressure: number[];
                humidity: number[];
            }>();

            for (let i = 0; i < times.length; i++) {
                const dateStr = times[i].split('T')[0]; // Get YYYY-MM-DD
                if (!dailyMap.has(dateStr)) {
                    dailyMap.set(dateStr, {
                        time: [],
                        temperature: [],
                        windSpeed: [],
                        windDirection: [],
                        pressure: [],
                        humidity: [],
                    });
                }
                const dayData = dailyMap.get(dateStr)!;
                dayData.time.push(times[i]);
                dayData.temperature.push(temps[i]);
                dayData.windSpeed.push(windSpeeds[i]);
                dayData.windDirection.push(windDirs[i]);
                dayData.pressure.push(pressures[i]);
                dayData.humidity.push(humidities[i]);
            }

            // Convert map to array, sorted by date
            const sortedDates = Array.from(dailyMap.keys()).sort();
            for (const dateStr of sortedDates) {
                dailyWeatherData.push({
                    date: dateStr,
                    hourly: dailyMap.get(dateStr)!,
                });
            }

            set({
                weatherData: currentWeather,
                dailyWeatherData,
            });

            let coastal = false;
            try {
                // Fetch 7 days of marine forecast data
                const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction,sea_surface_temperature&models=best_match&forecast_days=7`;
                const marineResponse = await fetch(marineUrl);

                if (marineResponse.ok) {
                    const marineJson = await marineResponse.json();
                    if (marineJson.hourly && marineJson.hourly.time) {
                        let marineCurrentIndex = marineJson.hourly.time.findIndex((t: string) => t >= currentHourISO);
                        if (marineCurrentIndex === -1) marineCurrentIndex = 0;

                        const currentMarine: MarineData = {
                            waveHeight: marineJson.hourly.wave_height?.[marineCurrentIndex] ?? null,
                            waveDirection: marineJson.hourly.wave_direction?.[marineCurrentIndex] ?? null,
                            waterTemperature: marineJson.hourly.sea_surface_temperature?.[marineCurrentIndex] ?? null,
                        };

                        // Process hourly marine data into daily chunks
                        const dailyMarineData: DailyMarineData[] = [];
                        const marineTimes = marineJson.hourly.time;
                        const waveHeights = marineJson.hourly.wave_height || [];
                        const waveDirs = marineJson.hourly.wave_direction || [];
                        const waterTemps = marineJson.hourly.sea_surface_temperature || [];

                        const marineDailyMap = new Map<string, {
                            time: string[];
                            waveHeight: number[];
                            waveDirection: number[];
                            waterTemperature: number[];
                        }>();

                        for (let i = 0; i < marineTimes.length; i++) {
                            const dateStr = marineTimes[i].split('T')[0];
                            if (!marineDailyMap.has(dateStr)) {
                                marineDailyMap.set(dateStr, {
                                    time: [],
                                    waveHeight: [],
                                    waveDirection: [],
                                    waterTemperature: [],
                                });
                            }
                            const dayData = marineDailyMap.get(dateStr)!;
                            dayData.time.push(marineTimes[i]);
                            dayData.waveHeight.push(waveHeights[i] ?? 0);
                            dayData.waveDirection.push(waveDirs[i] ?? 0);
                            dayData.waterTemperature.push(waterTemps[i] ?? 0);
                        }

                        const sortedMarineDates = Array.from(marineDailyMap.keys()).sort();
                        for (const dateStr of sortedMarineDates) {
                            dailyMarineData.push({
                                date: dateStr,
                                hourly: marineDailyMap.get(dateStr)!,
                            });
                        }

                        set({
                            marineData: currentMarine,
                            dailyMarineData,
                        });
                        coastal = true;
                    }
                } else {
                    set({ marineData: null, dailyMarineData: [] });
                }
            } catch (marineError) {
                console.warn('Error fetching marine data (non-critical):', marineError);
                set({ marineData: null, dailyMarineData: [] });
            }

            const solunar = calculateSolunarData(lat, lng);
            set({ solunarData: solunar, selectedDay: 0 }); // Reset to today when fetching new data

            if (coastal) {
                const tide = await generateMockTideData();
                set({ tideData: tide, isCoastal: true });
            } else {
                set({ tideData: null, isCoastal: false });
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load weather data';
            set({ 
                error: errorMessage,
                weatherData: null,
                marineData: null,
            });
        } finally {
            set({ loading: false });
        }
    },

    reset: () =>
        set({
            isExpanded: false,
            weatherData: null,
            marineData: null,
            solunarData: null,
            tideData: null,
            loading: false,
            error: null,
            currentTemp: null,
            locationName: null,
            isCoastal: false,
            expandedSections: INITIAL_SECTIONS,
            dailyWeatherData: [],
            dailyMarineData: [],
            selectedDay: 0,
            currentLat: null,
            currentLng: null,
        }),
}));

// Helpers
const calculateSolunarData = (lat: number, lng: number): SolunarData => {
    return calculateSolunarDataForDate(new Date(), lat, lng);
};

const calculateSolunarDataForDate = (date: Date, lat: number, lng: number): SolunarData => {
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    const latRad = lat * Math.PI / 180;
    const declRad = declination * Math.PI / 180;
    const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(declRad));

    const sunriseHour = 12 - (hourAngle * 180 / Math.PI) / 15;
    const sunsetHour = 12 + (hourAngle * 180 / Math.PI) / 15;

    const sunrise = new Date(today);
    sunrise.setHours(Math.floor(sunriseHour), (sunriseHour % 1) * 60, 0);

    const sunset = new Date(today);
    sunset.setHours(Math.floor(sunsetHour), (sunsetHour % 1) * 60, 0);

    const moonPhase = calculateMoonPhase(date);
    const majorPeriods = calculateFishingPeriods(sunrise, sunset);
    const biteRating = calculateBiteRating(majorPeriods, date, moonPhase);

    return {
        sunrise: sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        sunset: sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        moonPhase: moonPhase.name,
        moonRise: '--',
        moonSet: '--',
        majorPeriods,
        biteRating,
    };
};

const calculateMoonPhase = (date: Date): { name: string; value: number } => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const daysSinceNewMoon = (year * 365.25 + month * 30.6 + day) % 29.53;
    const phase = daysSinceNewMoon / 29.53;

    if (phase < 0.03 || phase > 0.97) return { name: 'New Moon', value: 0 };
    if (phase < 0.22) return { name: 'Waxing Crescent', value: 1 };
    if (phase < 0.28) return { name: 'First Quarter', value: 2 };
    if (phase < 0.47) return { name: 'Waxing Gibbous', value: 3 };
    if (phase < 0.53) return { name: 'Full Moon', value: 4 };
    if (phase < 0.72) return { name: 'Waning Gibbous', value: 5 };
    if (phase < 0.78) return { name: 'Last Quarter', value: 6 };
    return { name: 'Waning Crescent', value: 7 };
};

const calculateFishingPeriods = (sunrise: Date, sunset: Date): SolunarData['majorPeriods'] => {
    const periods: SolunarData['majorPeriods'] = [];

    const addPeriod = (start: Date, durationHours: number, type: 'major' | 'minor') => {
        const periodEnd = new Date(start);
        periodEnd.setHours(start.getHours() + durationHours);
        periods.push({
            start: start.toISOString(),
            end: periodEnd.toISOString(),
            type,
        });
    };

    const major1Start = new Date(sunrise);
    major1Start.setHours(major1Start.getHours() - 1);
    addPeriod(major1Start, 2, 'major');

    const minor1Start = new Date(sunrise);
    minor1Start.setHours(12, 0, 0);
    addPeriod(minor1Start, 1, 'minor');

    const major2Start = new Date(sunset);
    major2Start.setHours(major2Start.getHours() - 1);
    addPeriod(major2Start, 2, 'major');

    return periods;
};

const calculateBiteRating = (
    periods: SolunarData['majorPeriods'],
    now: Date,
    moonPhase: { name: string; value: number }
): number => {
    let rating = 50;
    const currentHour = now.getHours();

    const inMajorPeriod = periods.some((period) => {
        if (period.type !== 'major') return false;
        const startHour = new Date(period.start).getHours();
        const endHour = new Date(period.end).getHours();
        return currentHour >= startHour && currentHour <= endHour;
    });

    if (inMajorPeriod) rating += 30;
    if (moonPhase.value === 0 || moonPhase.value === 4) rating += 20;
    else if (moonPhase.value === 2 || moonPhase.value === 6) rating += 10;

    return Math.min(100, Math.max(0, rating));
};

const generateMockTideData = async (): Promise<TideData> => {
    const today = new Date();
    const tides: TideData['times'] = [];

    for (let i = 0; i < 24; i += 6) {
        const time = new Date(today);
        time.setHours(i, 0, 0, 0);
        const height = 2.5 + Math.sin((i / 12) * Math.PI) * 1.5;
        tides.push({
            time: time.toISOString(),
            height,
            type: height > 2.5 ? 'high' : 'low',
        });
    }

    const nextHigh = tides.find((t) => t.type === 'high' && new Date(t.time) > today) || tides[0];
    const nextLow = tides.find((t) => t.type === 'low' && new Date(t.time) > today) || tides[1];

    return {
        times: tides,
        nextHigh: { time: nextHigh.time, height: nextHigh.height },
        nextLow: { time: nextLow.time, height: nextLow.height },
    };
};


