"use client";

import React from 'react';
import { useI18n } from '@/lib/useI18n';
import { Fish, Scale, TrendingUp } from 'lucide-react';

interface UserStatsProps {
  totalCatches: number;
  totalWeight: number;
  avgWeight: number;
}

export const UserStats: React.FC<UserStatsProps> = ({ totalCatches, totalWeight, avgWeight }) => {
  const { dict } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-900 border-b border-zinc-800">
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="greyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="50%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#3f3f46" />
          </linearGradient>
        </defs>
      </svg>
      
      <div className="text-center flex flex-col items-center">
        <div className="flex items-center justify-center mb-2">
          <Fish size={20} stroke="url(#greyGrad)" strokeWidth={2} />
        </div>
        <div className="font-bold text-xl text-zinc-100">{totalCatches}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wide">{dict.catches}</div>
      </div>

      <div className="text-center flex flex-col items-center">
        <div className="flex items-center justify-center mb-2">
          <Scale size={20} stroke="url(#greyGrad)" strokeWidth={2} />
        </div>
        <div className="font-bold text-xl text-zinc-100">
          {totalWeight.toFixed(1)} <span className="text-sm font-normal text-zinc-500">{dict.kg}</span>
        </div>
        <div className="text-xs text-zinc-500 uppercase tracking-wide">{dict.total}</div>
      </div>

      <div className="text-center flex flex-col items-center">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp size={20} stroke="url(#greyGrad)" strokeWidth={2} />
        </div>
        <div className="font-bold text-xl text-zinc-100">
          {avgWeight.toFixed(1)} <span className="text-sm font-normal text-zinc-500">{dict.kg}</span>
        </div>
        <div className="text-xs text-zinc-500 uppercase tracking-wide">{dict.avg}</div>
      </div>
    </div>
  );
};

