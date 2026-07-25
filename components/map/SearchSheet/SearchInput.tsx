"use client";

import { Search, X } from 'lucide-react';
import { useRef } from 'react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onFocus: () => void;
    onBlur?: () => void;
    onClick: () => void;
    placeholder?: string;
    isSearching: boolean;
    inputRef?: React.RefObject<HTMLInputElement | null>;
    isSheetCollapsed?: boolean; // Pass sheet mode to know when to prevent focus
}

export function SearchInput({
    value,
    onChange,
    onFocus,
    onBlur,
    onClick,
    placeholder = "Search location...",
    isSearching,
    inputRef,
    isSheetCollapsed = false,
}: SearchInputProps) {
    const internalRef = useRef<HTMLInputElement>(null);
    const ref = inputRef || internalRef;

    return (
        <div
            className="flex items-center gap-3 bg-zinc-800/40 rounded-2xl px-4 py-1"
            style={{
                opacity: 1,
                transform: 'none',
                position: 'relative',
                zIndex: 70,
                marginBottom: '0.5rem',
            }}
        >
            <Search size={20} className="text-zinc-400" />
            <input
                ref={ref}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onClick={(e) => {
                    e.stopPropagation();
                    // Always trigger click handler (which expands sheet) when input is clicked
                    // This ensures we go to full mode even if currently in half mode
                    onClick();
                }}
                onFocus={(e) => {
                    // If sheet is collapsed, blur immediately and let the click handler expand first
                    if (isSheetCollapsed) {
                        e.target.blur();
                    } else {
                        onFocus();
                    }
                }}
                onBlur={onBlur}
                className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none h-12"
            />
            {value && !isSearching && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange('');
                    }}
                    className="p-1 rounded-full hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X size={16} />
                </button>
            )}
            {isSearching && (
                <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            )}
        </div>
    );
}

