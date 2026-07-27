import { create } from 'zustand';

export interface Notification {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  icon?: 'like' | 'comment' | 'success' | 'error' | 'info';
  href?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  position?: 'top' | 'center';
  showOkButton?: boolean;
  onOk?: () => void;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => {
      // Center modals replace each other — never stack side-by-side
      const withoutStaleCenter =
        notification.position === 'center'
          ? state.notifications.filter((n) => n.position !== 'center')
          : state.notifications;

      return {
        notifications: [...withoutStaleCenter, { ...notification, id }],
      };
    });

    // Don't auto-dismiss center notifications with OK button
    if (
      notification.duration !== 0 &&
      !(notification.position === 'center' && notification.showOkButton)
    ) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, notification.duration || 3000);
    }
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));


