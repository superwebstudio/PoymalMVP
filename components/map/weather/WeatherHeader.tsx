"use client";

import React from 'react';
import { X } from 'lucide-react';

interface WeatherHeaderProps {
    title: string;
    locationName?: string | null;
    onClose: () => void;
    icon: React.ReactNode;
}

export const WeatherHeader: React.FC<WeatherHeaderProps> = ({ title, locationName, onClose, icon }) => (
    <div className="flex items-center justify-between p-4 pb-3 border-b border-zinc-800 sticky top-0  z-10 rounded-t-2xl">
        <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {icon}
                {title}
            </h3>
            {locationName && (
                <p className="text-sm text-zinc-400 mt-1">{locationName}</p>
            )}
        </div>
        <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
        >
            <X size={18} className="text-zinc-400" />
        </button>
    </div>
);

