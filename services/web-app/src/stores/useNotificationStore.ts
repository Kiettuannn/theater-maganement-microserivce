import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationState {
  // State
  notifications: Notification[];
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      // Initial state
      notifications: [],
      
      // Actions
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const newNotification = { ...notification, id };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));
        
        // Auto remove after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }));
          }, notification.duration || 5000);
        }
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    { name: 'NotificationStore' }
  )
);

// Selectors
export const selectNotifications = (state: NotificationState) => state.notifications;
