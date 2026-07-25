"use client";

import { MapPin, Fish } from 'lucide-react';

interface SearchResultsProps {
    results: any[];
    onSelect: (feature: any) => void;
    dict?: any;
}

export function SearchResults({ results, onSelect, dict }: SearchResultsProps) {
    if (results.length === 0) return null;

    // Separate species and locations
    const speciesResults = results.filter(r => r.type === 'species');
    const locationResults = results.filter(r => r.type === 'location');

    return (
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
            {speciesResults.length > 0 && (
                <>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 pt-3 pb-2">
                        {dict?.fishSpecies || "Fish Species"}
                    </h4>
                    {speciesResults.map((feature, index) => (
                        <button
                            key={`species-${feature.id || index}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onSelect(feature);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-700/50 active:bg-zinc-600/50 transition-colors border-t border-zinc-700/50 flex items-center gap-3 cursor-pointer"
                            type="button"
                        >
                            <Fish size={16} className="text-blue-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-zinc-200 truncate">{feature.species}</div>
                                {feature.scientificName && (
                                    <div className="text-xs text-zinc-500 italic truncate">{feature.scientificName}</div>
                                )}
                            </div>
                        </button>
                    ))}
                </>
            )}
            
            {locationResults.length > 0 && (
                <>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 pt-3 pb-2 border-t border-zinc-700/50">
                        {dict?.locations || "Locations"}
                    </h4>
                    {locationResults.map((feature, index) => (
                        <button
                            key={`location-${index}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onSelect(feature);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-700/50 active:bg-zinc-600/50 transition-colors border-t border-zinc-700/50 flex items-center gap-3 cursor-pointer"
                            type="button"
                        >
                            <MapPin size={16} className="text-zinc-400 shrink-0" />
                            <div className="text-sm text-zinc-200 truncate">{feature.place_name}</div>
                        </button>
                    ))}
                </>
            )}
        </div>
    );
}

