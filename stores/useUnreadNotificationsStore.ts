'use client';

import { create } from 'zustand';

interface UnreadNotificationsState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useUnreadNotificationsStore = create<UnreadNotificationsState>(
  (set) => ({
    unreadCount: 0,
    setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  }),
);
