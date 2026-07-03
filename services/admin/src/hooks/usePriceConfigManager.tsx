import { useState, useCallback } from "react";
import {
  getAllPriceConfigs,
  createPriceConfig,
  updatePriceConfig,
  deletePriceConfig,
} from "@/services/priceConfigService";
import { getAllSeatTypes } from "@/services/seatTypeService";
import type { PriceConfig, PriceConfigRequest } from "@/types/PriceConfigType/priceConfig";
import type { SeatType } from "@/types/SeatType/seat";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";

export function usePriceConfigManager() {
  const [priceConfigs, setPriceConfigs] = useState<PriceConfig[]>([]);
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { confirmDialog, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [priceConfigsData, seatTypesData] = await Promise.all([
        getAllPriceConfigs(),
        getAllSeatTypes(),
      ]);
      setPriceConfigs(priceConfigsData);
      setSeatTypes(seatTypesData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.message || "Failed to load price configurations",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const handleCreatePriceConfig = useCallback(
    async (request: PriceConfigRequest): Promise<boolean> => {
      setSaving(true);
      try {
        const result = await createPriceConfig(request);
        
        // Check if it's an update (existing config) or new creation
        const existingIndex = priceConfigs.findIndex(
          pc => pc.id === result.id
        );
        
        if (existingIndex !== -1) {
          // Update existing config
          setPriceConfigs((prev) =>
            prev.map((pc) => (pc.id === result.id ? result : pc))
          );
        } else {
          // Add new config
          setPriceConfigs((prev) => [...prev, result]);
        }
        
        addNotification({
          type: "success",
          title: "Success",
          message: existingIndex !== -1 
            ? "Price configuration updated successfully"
            : "Price configuration created successfully",
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error.message || "Failed to create price configuration",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification, priceConfigs]
  );

  const handleUpdatePriceConfig = useCallback(
    async (id: string, request: PriceConfigRequest): Promise<boolean> => {
      setSaving(true);
      try {
        const updatedPriceConfig = await updatePriceConfig(id, request);
        setPriceConfigs((prev) =>
          prev.map((pc) => (pc.id === id ? updatedPriceConfig : pc))
        );
        addNotification({
          type: "success",
          title: "Success",
          message: "Price configuration updated successfully",
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error.message || "Failed to update price configuration",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  const handleDeletePriceConfig = useCallback(
    async (id: string) => {
      try {
        await deletePriceConfig(id);
        setPriceConfigs((prev) => prev.filter((pc) => pc.id !== id));
        addNotification({
          type: "success",
          title: "Success",
          message: "Price configuration deleted successfully",
        });
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error.message || "Failed to delete price configuration",
        });
      } finally {
        closeConfirmDialog();
      }
    },
    [addNotification, closeConfirmDialog]
  );

  const openDeleteConfirmDialog = useCallback(
    (id: string, description: string) => {
      showConfirmDialog({
        title: "Delete Price Configuration",
        description: `Are you sure you want to delete the price configuration for "${description}"? This action cannot be undone.`,
        onConfirm: () => handleDeletePriceConfig(id),
        variant: "destructive",
      });
    },
    [showConfirmDialog, handleDeletePriceConfig]
  );

  return {
    priceConfigs,
    seatTypes,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreatePriceConfig,
    handleUpdatePriceConfig,
    openDeleteConfirmDialog,
    closeConfirmDialog,
  };
}
