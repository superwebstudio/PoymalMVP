import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SelectionOption {
    id: string;
    label: string;
    icon: LucideIcon;
    description?: string;
}

interface SelectionGridProps {
    options: SelectionOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    columns?: 2 | 3;
    variant?: 'default' | 'subtle' | 'minimal';
}

export function SelectionGrid({ options, selectedId, onSelect, columns = 3, variant = 'default' }: SelectionGridProps) {
    const getButtonClasses = (isSelected: boolean) => {
        if (variant === 'minimal') {
            // Icon-only, very subtle
            return `
                relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200
                ${isSelected
                    ? 'bg-zinc-800 border-2 border-zinc-600 text-zinc-200'
                    : 'bg-transparent border-2 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                }
            `;
        } else if (variant === 'subtle') {
            // Dark gray/charcoal with subtle selection
            return `
                relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300
                ${isSelected
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-200 shadow-sm'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/40 hover:border-zinc-700'
                }
            `;
        } else {
            // Default: original blue style
            return `
                relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300
                ${isSelected
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/20'
                    : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800/60'
                }
            `;
        }
    };

    const getIconClasses = (isSelected: boolean) => {
        if (variant === 'minimal') {
            return isSelected ? 'text-zinc-200' : 'text-zinc-500';
        } else if (variant === 'subtle') {
            return isSelected ? 'text-zinc-200' : 'text-zinc-500';
        } else {
            return isSelected ? 'text-white' : 'text-zinc-500';
        }
    };

    const getLabelClasses = (isSelected: boolean) => {
        if (variant === 'minimal') {
            return `text-[10px] font-medium text-center mt-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`;
        } else if (variant === 'subtle') {
            return `text-xs font-medium text-center ${isSelected ? 'text-zinc-200' : 'text-zinc-400'}`;
        } else {
            return `text-xs font-medium text-center ${isSelected ? 'text-white' : 'text-zinc-400'}`;
        }
    };

    const iconSize = variant === 'minimal' ? 20 : 24;

    return (
        <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {options.map((option) => {
                const isSelected = selectedId === option.id;
                return (
                    <button
                        key={option.id}
                        onClick={() => onSelect(option.id)}
                        className={`${getButtonClasses(isSelected)} min-h-[80px]`}
                    >
                        <option.icon
                            size={iconSize}
                            className={`${variant === 'minimal' ? '' : 'mb-2'} ${getIconClasses(isSelected)}`}
                        />
                        {variant !== 'minimal' && (
                            <span className={getLabelClasses(isSelected)}>{option.label}</span>
                        )}
                        {variant === 'minimal' && (
                            <span className={getLabelClasses(isSelected)}>{option.label}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}