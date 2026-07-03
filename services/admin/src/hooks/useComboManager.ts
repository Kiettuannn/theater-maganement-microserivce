import { useState, useCallback } from "react";
import type { ComboWithItems, CreateComboRequest, ComboItem } from "@/types/ComboType/comboType";
import {
  getAllCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} from "@/services/comboService";
import {
  getComboItemsByComboId,
  createComboItem,
  updateComboItem,
  deleteComboItem,
} from "@/services/comboItemService";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";

export function useComboManager() {
  const [combos, setCombos] = useState<ComboWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { confirmDialog, showConfirmDialog, closeConfirmDialog } =
    useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load all combos with their items
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const combosData = await getAllCombos();
      
      // Load items for each combo
      const combosWithItems = await Promise.all(
        combosData.map(async (combo) => {
          try {
            const items = await getComboItemsByComboId(combo.id);
            return { ...combo, items };
          } catch (error) {
            // If fetching items fails, return combo without items
            return { ...combo, items: [] };
          }
        })
      );
      
      setCombos(combosWithItems);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load combos",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Create new combo with items
  const handleCreateCombo = useCallback(
    async (
      comboRequest: CreateComboRequest,
      items: Array<{ name: string; quantity: number }>
    ): Promise<boolean> => {
      try {
        setSaving(true);
        
        // First create the combo
        const newCombo = await createCombo(comboRequest);
        
        // Then create all combo items
        const createdItems: ComboItem[] = [];
        for (const item of items) {
          const createdItem = await createComboItem({
            comboId: newCombo.id,
            name: item.name,
            quantity: item.quantity,
          });
          createdItems.push(createdItem);
        }
        
        // Add to state with items
        setCombos((prev) => [{ ...newCombo, items: createdItems }, ...prev]);
        
        addNotification({
          type: "success",
          title: "Success",
          message: `Combo "${comboRequest.name}" created successfully`,
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to create combo",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Update combo with items
  const handleUpdateCombo = useCallback(
    async (
      id: string,
      comboRequest: CreateComboRequest,
      items: Array<{ id?: string; name: string; quantity: number }>
    ): Promise<boolean> => {
      try {
        setSaving(true);
        
        // Update the combo
        const updatedCombo = await updateCombo(id, comboRequest);
        
        // Get existing items
        const existingItems = await getComboItemsByComboId(id);
        const existingItemIds = existingItems.map(item => item.id);
        const newItemIds = items.filter(item => item.id).map(item => item.id);
        
        // Delete items that are not in the new list
        const itemsToDelete = existingItemIds.filter(itemId => !newItemIds.includes(itemId));
        for (const itemId of itemsToDelete) {
          await deleteComboItem(itemId);
        }
        
        // Update or create items
        const updatedItems: ComboItem[] = [];
        for (const item of items) {
          if (item.id) {
            // Update existing item
            const updatedItem = await updateComboItem(item.id, {
              name: item.name,
              quantity: item.quantity,
            });
            updatedItems.push(updatedItem);
          } else {
            // Create new item
            const createdItem = await createComboItem({
              comboId: id,
              name: item.name,
              quantity: item.quantity,
            });
            updatedItems.push(createdItem);
          }
        }
        
        // Update state
        setCombos((prev) =>
          prev.map((combo) =>
            combo.id === id ? { ...updatedCombo, items: updatedItems } : combo
          )
        );
        
        addNotification({
          type: "success",
          title: "Success",
          message: "Combo updated successfully",
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to update combo",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Delete combo (will also delete associated items on backend)
  const handleDeleteCombo = useCallback(
    async (comboId: string, comboName: string): Promise<void> => {
      showConfirmDialog({
        title: "Delete Combo",
        description: `Are you sure you want to delete combo "${comboName}"? This will also delete all associated items. This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            setSaving(true);
            await deleteCombo(comboId);
            setCombos((prev) => prev.filter((c) => c.id !== comboId));
            addNotification({
              type: "success",
              title: "Success",
              message: "Combo deleted successfully",
            });
            closeConfirmDialog();
          } catch (error: any) {
            addNotification({
              type: "error",
              title: "Error",
              message:
                error?.response?.data?.message || "Failed to delete combo",
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
    combos,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateCombo,
    handleUpdateCombo,
    handleDeleteCombo,
    closeConfirmDialog,
  };
}
