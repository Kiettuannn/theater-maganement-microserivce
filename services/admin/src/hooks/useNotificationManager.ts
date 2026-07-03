import { useState, useCallback } from "react";
import {
  getAllNotifications,
  sendNotification,
  deleteNotification,
  type NotificationRequest,
} from "@/services/notificationService";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";
import type { Notification } from "@/types/NotificationType/Notification";

export function useNotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const { confirmDialog, showConfirmDialog, closeConfirmDialog, setLoading: setDialogLoading } =
    useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load all notifications
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllNotifications();
      console.log("Loaded notifications:", data);
      setNotifications(data);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load notifications",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Send notification
  const handleSendNotification = useCallback(
    async (request: NotificationRequest): Promise<boolean> => {
      try {
        setSending(true);
        const newNotification = await sendNotification(request);
        setNotifications((prev) => {
          const notification = Array.isArray(newNotification) ? newNotification[0] : newNotification;
          return [notification as Notification, ...prev];
        });
        addNotification({
          type: "success",
          title: "Success",
          message: "Notification sent successfully",
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to send notification",
        });
        return false;
      } finally {
        setSending(false);
      }
    },
    [addNotification]
  );

  // Delete notification
  const handleDeleteNotification = useCallback(
    (notificationId: string, title: string) => {
      showConfirmDialog({
        title: "Delete Notification",
        description: `Are you sure you want to delete notification "${title}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            setDialogLoading(true);
            await deleteNotification(notificationId);
            setNotifications((prev) =>
              prev.filter((n) => n.id !== notificationId)
            );
            addNotification({
              type: "success",
              title: "Success",
              message: "Notification deleted successfully",
            });
            closeConfirmDialog();
          } catch (error: any) {
            setDialogLoading(false);
            addNotification({
              type: "error",
              title: "Error",
              message:
                error?.response?.data?.message || "Failed to delete notification",
            });
          }
        },
      });
    },
    [showConfirmDialog, addNotification, closeConfirmDialog, setDialogLoading]
  );

  return {
    notifications,
    loading,
    sending,
    confirmDialog,
    loadData,
    handleSendNotification,
    handleDeleteNotification,
    closeConfirmDialog,
  };
}
