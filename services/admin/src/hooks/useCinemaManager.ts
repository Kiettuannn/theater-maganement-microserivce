import { useState, useCallback } from "react";
import type { Cinema, CreateCinemaRequest } from "@/types/CinemaType/cinemaType";
import {
  getAllCinemas,
  createCinema,
  updateCinema,
  deleteCinema,
} from "@/services/cinemaService";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";

export function useCinemaManager() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { confirmDialog, showConfirmDialog, closeConfirmDialog } =
    useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load all cinemas
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const cinemasData = await getAllCinemas();
      setCinemas(cinemasData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load cinemas",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Create new cinema
  const handleCreateCinema = useCallback(
    async (request: CreateCinemaRequest): Promise<boolean> => {
      try {
        setSaving(true);
        const newCinema = await createCinema(request);
        setCinemas((prev) => [newCinema, ...prev]);
        addNotification({
          type: "success",
          title: "Success",
          message: `Cinema "${request.name}" created successfully`,
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to create cinema",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Update cinema
  const handleUpdateCinema = useCallback(
    async (id: string, request: CreateCinemaRequest): Promise<boolean> => {
      try {
        setSaving(true);
        const updatedCinema = await updateCinema(id, request);
        setCinemas((prev) =>
          prev.map((cinema) => (cinema.id === id ? updatedCinema : cinema))
        );
        addNotification({
          type: "success",
          title: "Success",
          message: "Cinema updated successfully",
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to update cinema",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Delete cinema
  const handleDeleteCinema = useCallback(
    async (cinemaId: string, cinemaName: string): Promise<void> => {
      showConfirmDialog({
        title: "Delete Cinema",
        description: `Are you sure you want to delete cinema "${cinemaName}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            setSaving(true);
            await deleteCinema(cinemaId);
            setCinemas((prev) => prev.filter((c) => c.id !== cinemaId));
            addNotification({
              type: "success",
              title: "Success",
              message: "Cinema deleted successfully",
            });
            closeConfirmDialog();
          } catch (error: any) {
            addNotification({
              type: "error",
              title: "Error",
              message:
                error?.response?.data?.message || "Failed to delete cinema",
            });
          } finally {
            setSaving(false);
          }
        },
      });
    },
    [showConfirmDialog, closeConfirmDialog, addNotification]
  );

  return {
    cinemas,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateCinema,
    handleUpdateCinema,
    handleDeleteCinema,
    closeConfirmDialog,
  };
}
