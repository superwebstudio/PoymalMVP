"use client";

import React, { useState } from 'react';
import { MapPin, Trash2, Pencil, Check, X, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedLocationsListProps {
    locations: Array<{
        id: string;
        name: string | null;
        latitude: number;
        longitude: number;
    }>;
    onSelect: (location: { lat: number; lng: number }) => void;
    onLocationClick: (location: { id: string; name: string | null; latitude: number; longitude: number }) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onWeatherClick?: (location: { lat: number; lng: number; name: string | null }) => void;
    dict: any;
}

export function SavedLocationsList({ locations, onSelect, onLocationClick, onDelete, onRename, onWeatherClick, dict }: SavedLocationsListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleStartEdit = (loc: { id: string; name: string | null }) => {
        setEditingId(loc.id);
        setEditName(loc.name || '');
    };

    const handleSaveEdit = (id: string) => {
        onRename(id, editName);
        setEditingId(null);
        setEditName('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    if (locations.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                {dict.noSavedLocations || "No saved locations yet"}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {locations.map((loc) => (
                <div
                    key={loc.id}
                    className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3"
                >
                    {editingId === loc.id ? (
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSaveEdit(loc.id);
                                    } else if (e.key === 'Escape') {
                                        handleCancelEdit();
                                    }
                                }}
                                className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none "
                                autoFocus
                            />
                            <button
                                onClick={() => handleSaveEdit(loc.id)}
                                className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                className="flex-1 flex items-center gap-3 text-left"
                                onClick={() => onLocationClick(loc)}
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <MapPin size={16} className="text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-200">
                                        {loc.name || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`}
                                    </h4>
                                    <span className="text-xs text-zinc-500">
                                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                    </span>
                                </div>
                            </button>

                            <div className="flex items-center gap-1">
                                {onWeatherClick && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onWeatherClick({ lat: loc.latitude, lng: loc.longitude, name: loc.name });
                                        }}
                                        className="p-2 text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                        title={dict.viewWeather || "View Weather"}
                                    >
                                        <CloudSun size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEdit(loc);
                                    }}
                                    className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(loc.id);
                                    }}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmId(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-[121] max-w-sm mx-auto"
                        >
                            <h3 className="text-lg font-bold text-zinc-200 mb-2">
                                {dict.confirmDelete || "Delete Location?"}
                            </h3>
                            <p className="text-sm text-zinc-400 mb-6">
                                {dict.confirmDeleteMessage || "Are you sure you want to delete this saved location? This action cannot be undone."}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
                                >
                                    {dict.cancel || "Cancel"}
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(deleteConfirmId);
                                        setDeleteConfirmId(null);
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-medium transition-colors"
                                >
                                    {dict.delete || "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

