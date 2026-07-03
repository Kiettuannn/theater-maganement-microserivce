import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { socketService } from "@/services/socketService";
import {
  getInAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notificationService";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import type { Notification } from "@/types/NotificationType/Notification";
import { selectToken, selectUserId } from "@/stores";
import { useAuthStore } from "@/stores/useAuthStore";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const currentUserId = useAuthStore(selectUserId);
  const token = useAuthStore(selectToken);
  const processedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Connect to Socket.IO with JWT token authentication
    if (token && currentUserId) {
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL ||
        (import.meta.env.PROD
          ? window.location.origin
          : "http://localhost:9092");

      console.log("Connecting to Socket.IO server:", socketUrl);
      console.log("Current user accountId:", currentUserId);
      socketService.connect(socketUrl, token);
    }

    // Listen for new notifications
    const handleNewNotification = (data: string | Notification) => {
      console.log("🔔 [NotificationBell] Received raw data:", data);
      console.log("🔔 Data type:", typeof data);

      // Parse JSON string if backend sends string (like chat-service)
      let notification: Notification;
      if (typeof data === "string") {
        try {
          notification = JSON.parse(data);
          console.log("🔔 Parsed notification:", notification);
        } catch (error) {
          console.error("❌ Failed to parse notification JSON:", error);
          return;
        }
      } else {
        notification = data;
      }

      console.log("🔔 Current userId:", currentUserId);
      console.log("🔔 Notification recipientId:", notification.recipientId);

      // Filter: Only show notifications for current user
      if (notification.recipientId !== currentUserId) {
        console.warn("❌ Notification not for current user, ignoring");
        return;
      }

      console.log("✅ Notification is for current user, processing...");

      // Deduplicate using ref to avoid stale closure
      if (processedIdsRef.current.has(notification.id)) {
        console.log(
          "⚠️ Duplicate notification detected, ignoring:",
          notification.id,
        );
        return;
      }

      // Mark as processed
      processedIdsRef.current.add(notification.id);

      // Add to notifications list
      setNotifications((prev) => {
        console.log(
          "📝 Adding notification to list. Previous count:",
          prev.length,
        );
        return [notification, ...prev];
      });

      // Increment unread count
      setUnreadCount((prev) => {
        console.log("🔢 Incrementing unread count from", prev, "to", prev + 1);
        return prev + 1;
      });

      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.content || "",
          icon: "/logo.png",
        });
      }
    };

    console.log("📡 Registering listener for 'notification:new' event");
    socketService.on("notification:new", handleNewNotification);

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Load initial notifications
    loadNotifications();

    return () => {
      socketService.off("notification:new", handleNewNotification);
    };
  }, [currentUserId, token]);

  const loadNotifications = async () => {
    try {
      const data = await getInAppNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.readAt).length);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
      // Revert on error
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // Revert on error
      loadNotifications();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600 dark:text-red-400";
      case "HIGH":
        return "text-orange-600 dark:text-orange-400";
      case "NORMAL":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const isUnread = (notification: Notification) => !notification.readAt;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() =>
                      isUnread(notification) && markAsRead(notification.id)
                    }
                    className={cn(
                      "p-4 hover:bg-accent cursor-pointer transition-colors",
                      isUnread(notification) && "bg-muted/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          isUnread(notification)
                            ? "bg-primary"
                            : "bg-transparent",
                        )}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isUnread(notification) && "text-foreground",
                            )}
                          >
                            {notification.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              getPriorityColor(notification.priority),
                            )}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <div
                          className="text-sm text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: notification.content,
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(notification.createdAt),
                            "MMM dd, HH:mm",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
