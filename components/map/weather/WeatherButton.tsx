"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cloud, Sun } from "lucide-react";
import { useWeatherStore } from "@/stores/useWeatherStore";

interface WeatherButtonProps {
  isBottomSheetOpen: boolean;
  onToggle: () => void;
}

export const WeatherButton: React.FC<WeatherButtonProps> = ({
  isBottomSheetOpen,
  onToggle,
}) => {
  const currentTemp = useWeatherStore((state) => state.currentTemp);
  const weatherData = useWeatherStore((state) => state.weatherData);
  const getWeatherIcon = () =>
    weatherData ? <Sun size={16} /> : <Cloud size={16} />;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className={`fixed left-4 top-40 flex touch-manipulation items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-sm text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/60 ${
        isBottomSheetOpen ? "z-[40]" : "z-[120]"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {getWeatherIcon()}
      <span>{currentTemp !== null ? `${currentTemp}°` : "--°"}</span>
    </motion.button>
  );
};
