"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, X } from 'lucide-react';

interface LocationPickerBottomSheetProps {
    dict: any;
    location: { lat: number; lng: number };
    onUseLocation: () => void;
    onCancel: () => void;
}

export const LocationPickerBottomSheet: React.FC<LocationPickerBottomSheetProps> = ({
    dict,
    location,
    onUseLocation,
    onCancel,
}) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.6 }}
                className="fixed inset-x-0 bottom-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 rounded-t-2xl z-[220]"
                style={{
                    paddingBottom: 'max(20px, calc(20px + env(safe-area-inset-bottom)))',
                }}
            >
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-200">
                            {dict.selectLocation || 'Select Location'}
                        </h3>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-zinc-400" />
                        </button>
                    </div>

                    <div className="space-y-4 mb-4">
                        <div className="flex items-center gap-3 text-zinc-300">
                            <MapPin size={18} className="text-red-500" />
                            <div className="flex flex-col flex-1">
                                <span className="text-sm font-mono">
                                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {dict.coordinates || 'Coordinates'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={onUseLocation}
                            className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl font-medium transition-colors"
                        >
                            <Check size={18} />
                            <span>{dict.useThisLocation || 'Use This Location'}</span>
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
                        >
                            {dict.cancel || 'Cancel'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};


