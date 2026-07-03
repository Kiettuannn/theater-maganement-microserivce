import { useState, useCallback } from "react";
import {
  getAllStaffs,
  createStaff,
  updateStaff,
  deleteStaff,
  type StaffRequest,
} from "@/services/staffService";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";
import type { StaffProfile } from "@/types/StaffType/StaffProfile";

export function useStaffManager() {
  const [staffs, setStaffs] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { confirmDialog, showConfirmDialog, closeConfirmDialog } =
    useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load all staffs
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const staffsData = await getAllStaffs();
      setStaffs(staffsData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load staffs",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);



  // Create new staff
  const handleCreateStaff = useCallback(
    async (request: StaffRequest): Promise<boolean> => {
      try {
        console.log("Creating staff with request:", request);
        setSaving(true);
        const newStaff = await createStaff(request);
        setStaffs((prev) => [...prev, newStaff]);
        addNotification({
          type: "success",
          title: "Success",
          message: `Staff "${request.firstName} ${request.lastName}" created successfully`,
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to create staff",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Update staff
  const handleUpdateStaff = useCallback(
    async (staffId: string, request: Partial<StaffRequest>): Promise<boolean> => {
      try {
        setSaving(true);
        const updatedStaff = await updateStaff(staffId, request);
        setStaffs((prev) =>
          prev.map((s) => (s.staffId === staffId ? updatedStaff : s))
        );
        addNotification({
          type: "success",
          title: "Success",
          message: "Staff updated successfully",
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to update staff",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Delete staff
  const handleDeleteStaff = useCallback(
    async (staffId: string, staffName: string): Promise<void> => {
      showConfirmDialog({
        title: "Delete Staff",
        description: `Are you sure you want to delete staff "${staffName}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            setSaving(true);
            await deleteStaff(staffId);
            setStaffs((prev) => prev.filter((s) => s.staffId !== staffId));
            addNotification({
              type: "success",
              title: "Success",
              message: "Staff deleted successfully",
            });
            closeConfirmDialog();
          } catch (error: any) {
            addNotification({
              type: "error",
              title: "Error",
              message:
                error?.response?.data?.message || "Failed to delete staff",
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
    staffs,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateStaff,
    handleUpdateStaff,
    handleDeleteStaff,
    closeConfirmDialog: closeConfirmDialog,
  };
}
