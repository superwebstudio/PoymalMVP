"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { ALL_COUNTRIES, Country } from '@/data/countries';
import { useI18n } from '@/lib/useI18n';

interface CountrySearchProps {
    value: string | null;
    onChange: (code: string | null) => void;
    disabled?: boolean;
}

export function CountrySearch({ value, onChange, disabled }: CountrySearchProps) {
    const { dict, lang } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCountries, setFilteredCountries] = useState<Country[]>(ALL_COUNTRIES);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedCountry = value ? ALL_COUNTRIES.find(c => c.code === value) : null;

    // Filter countries based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredCountries(ALL_COUNTRIES);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = ALL_COUNTRIES.filter(country => {
            const nameEn = country.name.toLowerCase();
            const nameRu = country.nameRu.toLowerCase();
            const code = country.code.toLowerCase();
            return nameEn.includes(query) || nameRu.includes(query) || code.includes(query);
        });
        setFilteredCountries(filtered);
    }, [searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleSelect = (country: Country) => {
        onChange(country.code);
        setIsOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setSearchQuery('');
        setIsOpen(false);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        inputRef.current?.select();
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <div
                    onClick={() => !disabled && inputRef.current?.focus()}
                    className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus-within:border-sky-500 focus-within:outline-none cursor-text"
                >
                    <Search size={16} className="text-zinc-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={isOpen ? searchQuery : (selectedCountry ? (lang === 'ru' ? selectedCountry.nameRu : selectedCountry.name) : '')}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={handleInputFocus}
                        placeholder={dict.selectCountry || 'Select country...'}
                        disabled={disabled}
                        className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden z-50">
                    {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                            <button
                                key={country.code}
                                type="button"
                                onClick={() => handleSelect(country)}
                                className={`w-full text-left px-4 py-2.5 hover:bg-zinc-800 transition-colors flex items-center gap-3 ${
                                    value === country.code ? 'bg-sky-600/20 border-l-2 border-sky-500' : ''
                                }`}
                            >
                                <span className="text-xl flex-shrink-0">{country.flag}</span>
                                <span className="flex-1 text-zinc-200">
                                    {lang === 'ru' ? country.nameRu : country.name}
                                </span>
                                {value === country.code && (
                                    <span className="text-blue-400 text-xs">✓</span>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-center text-zinc-400 text-sm">
                            {dict.noResults || 'No results found'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}





