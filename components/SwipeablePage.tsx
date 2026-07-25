"use client";

import React from 'react';
import { ReactNode } from 'react';

interface SwipeablePageProps {
  children: ReactNode;
  previousPageComponent?: ReactNode;
  onSwipeComplete?: () => void;
  className?: string;
}

// Swipe functionality has been disabled - this is now just a simple wrapper
export function SwipeablePage({
  children,
  previousPageComponent,
  onSwipeComplete,
  className = "",
}: SwipeablePageProps) {
  return (
    <div
      className={`fixed inset-0 flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden ${className}`}
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex-1 relative z-10 bg-zinc-950 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
