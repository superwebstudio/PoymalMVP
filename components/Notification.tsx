"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, Heart, MessageCircle } from 'lucide-react';
import { useNotificationStore, type Notification } from '@/stores/useNotificationStore';

function notificationIcon(notification: Notification): React.ReactNode {
  if (notification.icon === 'like') {
    return <Heart size={18} className="shrink-0 text-red-400 fill-red-400" />;
  }
  if (notification.icon === 'comment') {
    return <MessageCircle size={18} className="shrink-0 text-sky-400" />;
  }
  if (notification.type === 'success') {
    return <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />;
  }
  if (notification.type === 'error') {
    return <AlertCircle size={18} className="shrink-0 text-red-400" />;
  }
  return <Info size={18} className="shrink-0 text-sky-400" />;
}

export const NotificationContainer = (): React.JSX.Element => {
  const { notifications, removeNotification } = useNotificationStore();

  const topNotifications = notifications.filter(
    (n) => !n.position || n.position === 'top',
  );
  const centerNotifications = notifications.filter(
    (n) => n.position === 'center',
  );
  // One center modal only — multiple siblings sat side-by-side in a flex row
  const activeCenter =
    centerNotifications.length > 0
      ? centerNotifications[centerNotifications.length - 1]
      : null;

  useEffect(() => {
    if (centerNotifications.length <= 1) return;
    centerNotifications.slice(0, -1).forEach((n) => {
      removeNotification(n.id);
    });
  }, [centerNotifications, removeNotification]);

  const dismissAllCenter = (): void => {
    centerNotifications.forEach((n) => removeNotification(n.id));
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <AnimatePresence>
          {topNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              layout
              className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white shadow-2xl backdrop-blur-xl"
            >
              <div className="mt-0.5">{notificationIcon(notification)}</div>
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-100">
                {notification.message}
              </span>

              {notification.action && (
                <button
                  type="button"
                  onClick={notification.action.onClick}
                  className="shrink-0 text-sm font-semibold text-sky-400 hover:text-sky-300"
                >
                  {notification.action.label}
                </button>
              )}

              <button
                type="button"
                onClick={() => removeNotification(notification.id)}
                className="mt-0.5 shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X size={14} className="text-zinc-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeCenter && (
          <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div
              key="center-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => {
                if (!activeCenter.showOkButton) {
                  dismissAllCenter();
                }
              }}
            />
            <motion.div
              key={activeCenter.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 px-6 py-5 shadow-2xl backdrop-blur-xl"
            >
              <p className="mb-4 whitespace-pre-wrap text-center text-zinc-200">
                {activeCenter.message}
              </p>

              <div className="flex gap-3">
                {activeCenter.showOkButton && (
                  <button
                    type="button"
                    onClick={() => {
                      activeCenter.onOk?.();
                      dismissAllCenter();
                    }}
                    className="flex-1 rounded-xl bg-sky-600 py-2.5 font-medium text-white transition-colors hover:bg-sky-500"
                  >
                    {activeCenter.action?.label || 'OK'}
                  </button>
                )}
                {activeCenter.action && !activeCenter.showOkButton && (
                  <button
                    type="button"
                    onClick={() => {
                      activeCenter.action?.onClick();
                      dismissAllCenter();
                    }}
                    className="flex-1 rounded-xl bg-sky-600 py-2.5 font-medium text-white transition-colors hover:bg-sky-500"
                  >
                    {activeCenter.action.label}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
