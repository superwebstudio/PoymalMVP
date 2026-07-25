"use client";

import React from "react";
import { ChevronDown, ChevronUp, Droplets } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { useLogStore } from "@/stores/useLogStore";
import { WeatherSection } from "@/components/LogCatchPage/WeatherSection";

interface AdditionalDetailsProps {
  dict: Record<string, string>;
  location?: string;
  latitude: number | null;
  longitude: number | null;
}

export const AdditionalDetails: React.FC<AdditionalDetailsProps> = ({
  dict,
  location,
  latitude,
  longitude,
}) => {
  const { register } = useFormContext();
  const store = useLogStore();
  const { showAdditional, includeWeather } = store;

  const handleWeatherToggle = () => {
    const next = !includeWeather;
    store.setIncludeWeather(next);
    if (next && !showAdditional) {
      store.setShowAdditional(true);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => store.setShowAdditional((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-200"
      >
        <span>{dict.additionalDetails || "Additional Details (Optional)"}</span>
        {showAdditional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence initial={false}>
        {showAdditional && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-hidden border-t border-zinc-800 px-4 pb-4"
          >
            <div className="pt-3">
              <label className="ml-1 flex items-center gap-1 text-xs text-zinc-400">
                <Droplets size={12} /> {dict.depthLabel || "Depth"}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                {...register("depth")}
                placeholder={dict.depthLabel || "Depth"}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-base text-white focus:outline-none"
              />
            </div>

            <div className="space-y-3 border-t border-zinc-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">
                  {dict.includeWeather || "Include Weather"}
                </span>
                <button
                  type="button"
                  onClick={handleWeatherToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${includeWeather ? "bg-green-600" : "bg-zinc-600"
                    }`}
                  role="switch"
                  aria-checked={includeWeather}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeWeather ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {includeWeather && (
                <WeatherSection
                  dict={dict}
                  includeWeather={includeWeather}
                  location={location}
                  latitude={latitude}
                  longitude={longitude}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
