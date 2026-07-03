import { useState, useCallback } from "react";
import type { ShowtimeResponse, UpdateShowtimeRequest } from "@/services/showtimeService";
import {
  getAllShowtimes,
  updateShowtime,
  deleteShowtime,
} from "@/services/showtimeService";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";

export function useShowtimeManager() {
  const [showtimes, setShowtimes] = useState<ShowtimeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { confirmDialog, showConfirmDialog, closeConfirmDialog } =
    useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load all showtimes
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const showtimesData = await getAllShowtimes();
      setShowtimes(showtimesData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load showtimes",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Refresh showtimes (used by auto-refresh)
  const refreshShowtimes = useCallback(async () => {
    try {
      const showtimesData = await getAllShowtimes();
      setShowtimes(showtimesData);
    } catch (error: any) {
      console.error("Failed to refresh showtimes:", error);
    }
  }, []);

  // Update showtime
  const handleUpdateShowtime = useCallback(
    async (id: string, request: UpdateShowtimeRequest): Promise<boolean> => {
      try {
        setSaving(true);
        const updatedShowtime = await updateShowtime(id, request);
        setShowtimes((prev) =>
          prev.map((showtime) => (showtime.id === id ? updatedShowtime : showtime))
        );
        addNotification({
          type: "success",
          title: "Success",
          message: "Showtime updated successfully",
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to update showtime",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Delete showtime
  const handleDeleteShowtime = useCallback(
    async (showtime: ShowtimeResponse): Promise<void> => {
      if (showtime.status !== "SCHEDULED") {
        addNotification({
          type: "error",
          title: "Cannot Delete",
          message: "Only scheduled showtimes can be deleted",
        });
        return;
      }

      showConfirmDialog({
        title: "Delete Showtime",
        description: `Are you sure you want to delete this showtime?\n\nMovie: ${showtime.movieName}\nRoom: ${showtime.roomName}\n\nNote: This showtime can only be deleted if no seats have been sold.`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            setSaving(true);
            await deleteShowtime(showtime.id);
            setShowtimes((prev) => prev.filter((s) => s.id !== showtime.id));
            addNotification({
              type: "success",
              title: "Success",
              message: "Showtime deleted successfully",
            });
            closeConfirmDialog();
          } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Failed to delete showtime";
            
            // Show specific message for sold seats
            if (errorMessage.includes("SEAT") || errorMessage.includes("sold")) {
              addNotification({
                type: "error",
                title: "Cannot Delete Showtime",
                message: "This showtime has sold seats and cannot be deleted",
              });
            } else {
              addNotification({
                type: "error",
                title: "Error",
                message: errorMessage,
              });
            }
          } finally {
            setSaving(false);
          }
        },
      });
    },
    [showConfirmDialog, closeConfirmDialog, addNotification]
  );

  return {
    showtimes,
    setShowtimes,
    loading,
    saving,
    confirmDialog,
    loadData,
    refreshShowtimes,
    handleUpdateShowtime,
    handleDeleteShowtime,
    closeConfirmDialog,
  };
}
