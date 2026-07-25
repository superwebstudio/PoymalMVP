"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

type PolledNotification = {
  id: string;
  type: string;
  content: string | null;
  catchId: string | null;
  isRead: boolean;
  createdAt: string;
};

const POLL_MS = 15_000;

/**
 * Polls for unread like/comment notifications and shows top toasts.
 */
export function NotificationListener() {
  const router = useRouter();
  const { userId } = useUserStore();
  const notificationsEnabled = usePreferencesStore(
    (s) => s.preferences.notificationsEnabled
  );
  const addNotification = useNotificationStore((s) => s.addNotification);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    if (!userId || !notificationsEnabled) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch('/api/notifications', {
          credentials: 'include',
        });
        if (!response.ok || cancelled) return;

        const data = await response.json();
        const items: PolledNotification[] = data.notifications || [];
        const unread = items.filter((n) => !n.isRead);

        if (!primedRef.current) {
          unread.forEach((n) => seenIdsRef.current.add(n.id));
          primedRef.current = true;
          return;
        }

        for (const item of unread) {
          if (seenIdsRef.current.has(item.id)) continue;
          seenIdsRef.current.add(item.id);

          const href = item.catchId ? `/catch/${item.catchId}` : '/notifications';
          addNotification({
            message: item.content || 'New notification',
            type: 'info',
            icon: item.type === 'comment' ? 'comment' : 'like',
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => router.push(href),
            },
          });
        }
      } catch {
        // Ignore transient poll errors
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [userId, notificationsEnabled, addNotification, router]);

  useEffect(() => {
    primedRef.current = false;
    seenIdsRef.current = new Set();
  }, [userId]);

  return null;
}
