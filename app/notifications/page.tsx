"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { useI18n } from '@/lib/useI18n';
import { Bell, Heart, MessageCircle } from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';

type NotificationActor = {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
};

type AppNotification = {
  id: string;
  type: string;
  content: string | null;
  catchId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: NotificationActor | null;
};

export default function NotificationsPage() {
  const { dict } = useI18n();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationId ? { notificationId } : {}),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          notificationId
            ? n.id === notificationId
              ? { ...n, isRead: true }
              : n
            : { ...n, isRead: true }
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const renderIcon = (type: string) => {
    if (type === 'comment') {
      return <MessageCircle size={18} className="text-blue-400" />;
    }
    return <Heart size={18} className="text-red-400" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 pb-[80px] text-zinc-100">
      <TelegramBackButton fallbackUrl="/" />
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="text-white" size={24} />
          <h1 className="text-xl font-bold text-zinc-200">
            {dict.notifications || 'Notifications'}
          </h1>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={() => markAsRead()}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            {dict.markAllRead || 'Mark all read'}
          </button>
        )}
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="text-center py-20 text-zinc-500">{dict.loading || 'Loading...'}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">{dict.noNotifications || 'No notifications'}</p>
            <p className="text-sm mt-2">
              {dict.notificationsHint || 'Likes and comments on your posts will appear here'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notification) => {
              const href = notification.catchId
                ? `/catch/${notification.catchId}`
                : undefined;
              const content = (
                <div
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                    notification.isRead
                      ? 'border-zinc-800 bg-zinc-900/40'
                      : 'border-zinc-700 bg-zinc-900'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{renderIcon(notification.type)}</div>
                  {notification.actor?.photoUrl ? (
                    <CachedImage
                      src={notification.actor.photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
                      {(notification.actor?.firstName ||
                        notification.actor?.username ||
                        '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-200">{notification.content}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={notification.id}>
                  {href ? (
                    <Link
                      href={href}
                      onClick={() => {
                        if (!notification.isRead) {
                          void markAsRead(notification.id);
                        }
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
