"use client";

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number | null | undefined;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
  readOnly?: boolean;
}

export function StarRating({
  value,
  onChange,
  size = 18,
  className,
  readOnly = false,
}: StarRatingProps): React.JSX.Element {
  const rating = typeof value === 'number' && value > 0 ? Math.min(5, Math.round(value)) : 0;
  const interactive = Boolean(onChange) && !readOnly;

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={rating > 0 ? `${rating} of 5 stars` : 'No rating'}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        if (!interactive) {
          return (
            <Star
              key={star}
              size={size}
              className={filled ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === rating}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange?.(star === rating ? 0 : star)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <Star
              size={size}
              className={filled ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-500'}
            />
          </button>
        );
      })}
    </div>
  );
}
