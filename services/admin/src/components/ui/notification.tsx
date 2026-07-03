import { useEffect } from "react";
import { X } from "lucide-react";
import { useNotificationStore, selectNotifications } from "@/stores";
import { cn } from "@/utils/cn";

export function NotificationContainer() {
  const notifications = useNotificationStore(selectNotifications);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification
  );

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: {
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  };
  onClose: () => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  useEffect(() => {
    // Animation on mount
    const timer = setTimeout(() => {
      const element = document.getElementById(
        `notification-${notification.id}`
      );
      if (element) {
        element.classList.remove("translate-x-full", "opacity-0");
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [notification.id]);

  const typeStyles = {
    success:
      "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100",
    error:
      "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100",
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100",
  };

  const iconStyles = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      id={`notification-${notification.id}`}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto",
        "translate-x-full opacity-0 transition-all duration-300 ease-out",
        typeStyles[notification.type]
      )}
    >
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold text-lg">
        {iconStyles[notification.type]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{notification.title}</p>
        <p className="text-sm opacity-90 mt-1">{notification.message}</p>
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
