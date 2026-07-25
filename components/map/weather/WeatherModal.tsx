"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sheet } from 'react-modal-sheet';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { BiteForecastCard } from './BiteForecastCard';
import { WeatherSummaryGrid } from './WeatherSummaryGrid';
import { MarineConditions } from './MarineConditions';
import { TideChart } from './TideChart';
import { Backdrop } from '@/components/ui/Backdrop';

interface WeatherModalProps {
    dict: any;
    isBottomSheetOpen: boolean;
    getWeatherIcon: () => React.ReactNode;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({ dict, isBottomSheetOpen, getWeatherIcon }) => {
    const {
        isExpanded,
        toggleExpanded,
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
        dailyWeatherData,
        selectedDay,
        setSelectedDay,
        getWeatherForDay,
        getMarineForDay,
        getSolunarForDay,
    } = useWeatherStore();

    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const prevSections = useRef<Set<string>>(expandedSections);
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const dateContainerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const [dragOffset, setDragOffset] = useState(0); // in pixels, tracks continuous drag
    const [slideProgress, setSlideProgress] = useState(0); // 0 to 1, tracks swipe progress

    // Backdrop state for smooth animation
    const [showBackdrop, setShowBackdrop] = useState(false);
    const closeTimerRef = useRef<number | null>(null);

    // Smooth open: backdrop first, then sheet
    const openSmooth = useCallback(() => {
        setShowBackdrop(true);
        requestAnimationFrame(() => {
            useWeatherStore.getState().setExpanded(true);
        });
    }, []);

    // Smooth close: sheet first, then backdrop fades out
    const closeSmooth = useCallback(() => {
        useWeatherStore.getState().setExpanded(false);
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = window.setTimeout(() => {
            setShowBackdrop(false);
            closeTimerRef.current = null;
        }, 320);
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    // Handle sheet open/close based on isExpanded
    useEffect(() => {
        if (isExpanded && !showBackdrop) {
            openSmooth();
        } else if (!isExpanded && showBackdrop) {
            closeSmooth();
        }
    }, [isExpanded, showBackdrop, openSmooth, closeSmooth]);

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

    // Get available days count (today + forecast days)
    const availableDays = Math.max(1, dailyWeatherData.length);
    const maxDay = availableDays - 1;

    // Get weather data for selected day
    const selectedWeatherData = getWeatherForDay(selectedDay);
    const selectedMarineData = getMarineForDay(selectedDay);
    const selectedSolunarData = getSolunarForDay(selectedDay);

    // Format day label
    const getDayLabel = (dayIndex: number): string => {
        if (dayIndex === 0) return dict.today || 'Today';
        if (dayIndex === 1) return dict.tomorrow || 'Tomorrow';

        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayIndex);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[targetDate.getDay()];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[targetDate.getMonth()];
        const day = targetDate.getDate();

        return `${dayName}, ${monthName} ${day}`;
    };

    const handleDayChange = (newDay: number) => {
        if (newDay >= 0 && newDay <= maxDay) {
            setSelectedDay(newDay);
        }
    };

    // Calculate resisted offset for edge resistance effect
    const getResistedOffset = (offset: number): number => {
        if (selectedDay === 0 && offset > 0) return offset * 0.3; // Resist dragging right at start
        if (selectedDay >= maxDay && offset < 0) return offset * 0.3; // Resist dragging left at end
        return offset;
    };

    // Handle touch/swipe gestures
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        setDragOffset(0);
        setSlideProgress(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = touchStartX.current - currentX;
        const diffY = touchStartY.current - currentY;

        // Only allow horizontal swipe if |diffX| > |diffY| (prevent vertical scroll interference)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
            e.preventDefault(); // Important: prevent vertical scrolling
            const resistedOffset = getResistedOffset(-diffX); // negative because dragging left should show next day
            setDragOffset(resistedOffset);

            // Calculate slide progress for opacity effects
            const containerWidth = contentContainerRef.current?.offsetWidth || window.innerWidth;
            const progress = Math.min(Math.max(Math.abs(diffX) / containerWidth, 0), 1);
            setSlideProgress(progress);
        }
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null) return;

        const containerWidth = contentContainerRef.current?.offsetWidth || window.innerWidth;
        const dragThreshold = containerWidth * 0.15; // 15% to trigger day change

        let newDay = selectedDay;

        if (Math.abs(dragOffset) > dragThreshold) {
            if (dragOffset < 0 && selectedDay < maxDay) {
                newDay = selectedDay + 1; // dragged left → next day
            } else if (dragOffset > 0 && selectedDay > 0) {
                newDay = selectedDay - 1; // dragged right → prev day
            }
        }

        // Animate to final position
        setSelectedDay(newDay);
        setDragOffset(0);
        setSlideProgress(0);

        touchStartX.current = null;
        touchStartY.current = null;
    };

    // Calculate opacity for each day based on position and slide progress
    const getDayOpacity = (dayIndex: number): number => {
        const distance = Math.abs(dayIndex - selectedDay);

        // While dragging (slideProgress > 0)
        if (slideProgress > 0) {
            if (distance === 0) {
                // Current day: fade from 100% to 50% as you swipe
                return 1 - (slideProgress * 0.5);
            } else if (distance === 1) {
                // Adjacent day: fade from 30% to 100% as you swipe
                return 0.3 + (slideProgress * 0.7);
            } else {
                // Far days: stay at 30%
                return 0.3;
            }
        }

        // When static (slideProgress === 0)
        if (distance === 0) {
            // Current day: 100% opacity
            return 1;
        } else if (distance === 1) {
            // Adjacent days: 40% opacity (preview)
            return 0.4;
        } else {
            // Far days: 0% opacity (hidden)
            return 0;
        }
    };

    return (
        <>
            {showBackdrop && (
                <Backdrop
                    isOpen={isExpanded}
                    onClose={closeSmooth}
                    blur={true}
                    zIndex={90}
                />
            )}

            <Sheet
                isOpen={isExpanded}
                onClose={closeSmooth}
                snapPoints={[0, 0.5, 0.85, 1]}
                initialSnap={2}
                style={{ zIndex: isBottomSheetOpen ? 90 : 130 }}
            >
                <Sheet.Container
                    style={{
                        backgroundColor: '#18181b',
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        borderColor: 'rgb(39, 39, 42)',
                        borderWidth: '1px',
                    }}
                >
                    <Sheet.Header>
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeSmooth();
                            }}
                            className="absolute top-4 right-4 z-[100] rounded-full p-2 hover:bg-zinc-800 text-zinc-300 transition-colors pointer-events-auto touch-manipulation"
                            style={{ zIndex: 100 }}
                        >
                            <X size={20} />
                        </button>
                    </Sheet.Header>

                    <Sheet.Content className="px-4 pb-4 overflow-y-auto">
                        <div className="flex flex-col min-h-full">
                            {/* Header */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    {getWeatherIcon()}
                                    <h3 className="text-lg font-semibold text-white">{dict.weather}</h3>
                                </div>
                                {locationName && (
                                    <p className="text-sm text-zinc-400">{locationName}</p>
                                )}
                            </div>

                            {loading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {error && (
                                <div className="text-red-400 text-sm text-center py-4">{error}</div>
                            )}

                            {!loading && !error && availableDays > 0 && (
                                <div
                                    ref={contentContainerRef}
                                    className="relative overflow-hidden pb-20"
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    <div
                                        className="flex"
                                        style={{
                                            transform: `translateX(calc(-${selectedDay * 100}% + ${dragOffset}px))`,
                                            transition: dragOffset !== 0 ? 'none' : 'transform 300ms ease-out',
                                        }}
                                    >
                                        {Array.from({ length: availableDays }).map((_, dayIndex) => {
                                            const dayWeatherData = getWeatherForDay(dayIndex);
                                            const dayMarineData = getMarineForDay(dayIndex);
                                            const daySolunarData = getSolunarForDay(dayIndex);

                                            if (!dayWeatherData) return null;

                                            return (
                                                <div
                                                    key={dayIndex}
                                                    className="flex-shrink-0 w-full px-2 transition-opacity duration-200"
                                                    style={{ opacity: getDayOpacity(dayIndex) }}
                                                >
                                                    <div className="space-y-3">
                                                        {daySolunarData && (
                                                            <BiteForecastCard
                                                                dict={dict}
                                                                solunarData={daySolunarData}
                                                                weatherData={dayWeatherData}
                                                            />
                                                        )}

                                                        <WeatherSummaryGrid dict={dict} weatherData={dayWeatherData} />

                                                        {dayMarineData && (
                                                            <div ref={(el) => { sectionRefs.current[`marine-${dayIndex}`] = el; }}>
                                                                <MarineConditions
                                                                    dict={dict}
                                                                    data={dayMarineData}
                                                                    isOpen={expandedSections.has('marine')}
                                                                    onToggle={toggleSection}
                                                                />
                                                            </div>
                                                        )}

                                                        {tideData && isCoastal && dayIndex === 0 && (
                                                            <div ref={(el) => { sectionRefs.current[`tide-${dayIndex}`] = el; }}>
                                                                <TideChart
                                                                    dict={dict}
                                                                    data={tideData}
                                                                    isOpen={expandedSections.has('tide')}
                                                                    onToggle={toggleSection}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Swipeable Date Selector */}
                            {!loading && !error && availableDays > 1 && (
                                <div
                                    className="fixed left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50 pb-safe"
                                    style={{
                                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                                        <button
                                            onClick={() => handleDayChange(selectedDay - 1)}
                                            disabled={selectedDay === 0}
                                            className={`p-2 rounded-lg transition-colors ${selectedDay === 0
                                                ? 'text-zinc-600 cursor-not-allowed'
                                                : 'text-zinc-300 hover:bg-zinc-800'
                                                }`}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>

                                        <div
                                            ref={dateContainerRef}
                                            className="flex-1 relative overflow-hidden"
                                        >
                                            <div
                                                className="flex"
                                                style={{
                                                    transform: `translateX(calc(-${selectedDay * 100}% + ${dragOffset}px))`,
                                                    transition: dragOffset !== 0 ? 'none' : 'transform 300ms ease-out',
                                                }}
                                            >
                                                {Array.from({ length: availableDays }).map((_, dayIndex) => (
                                                    <div
                                                        key={dayIndex}
                                                        className="flex-shrink-0 w-full text-center transition-opacity duration-200"
                                                        style={{ opacity: getDayOpacity(dayIndex) }}
                                                    >
                                                        <span className="text-sm font-medium text-white">
                                                            {getDayLabel(dayIndex)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDayChange(selectedDay + 1)}
                                            disabled={selectedDay >= maxDay}
                                            className={`p-2 rounded-lg transition-colors ${selectedDay >= maxDay
                                                ? 'text-zinc-600 cursor-not-allowed'
                                                : 'text-zinc-300 hover:bg-zinc-800'
                                                }`}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Sheet.Content>
                </Sheet.Container>
            </Sheet>
        </>
    );
};

