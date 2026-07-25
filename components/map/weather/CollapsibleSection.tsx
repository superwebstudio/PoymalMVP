"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleSectionProps {
    id: string;
    title: React.ReactNode;
    icon?: React.ReactNode;
    isOpen: boolean;
    onToggle: (section: string) => void;
    children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    id,
    title,
    icon,
    isOpen,
    onToggle,
    children,
}) => (
    <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 overflow-hidden">
        <button
            onClick={() => onToggle(id)}
            className="w-full p-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
        >
            <div className="flex items-center gap-2 text-white text-sm font-semibold">
                {icon}
                {title}
            </div>
            <span className="text-zinc-400 text-xs">{isOpen ? '−' : '+'}</span>
        </button>

        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-3"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);


