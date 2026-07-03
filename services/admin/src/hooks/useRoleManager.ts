import { useState, useCallback } from "react";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  type Role,
  type RoleRequest,
} from "@/services/roleService";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";

export function useRoleManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { confirmDialog, showConfirmDialog, closeConfirmDialog, confirmAndClose } = useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load roles
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const rolesData = await getAllRoles();
      setRoles(rolesData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Create new role
  const handleCreateRole = useCallback(
    async (request: RoleRequest): Promise<boolean> => {
      try {
        setSaving(true);
        const newRole = await createRole(request);
        setRoles((prev) => [...prev, newRole]);
        addNotification({
          type: "success",
          title: "Success",
          message: `Role "${request.name}" created successfully`,
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error.response?.data?.message || "Failed to create role",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Update role
  const handleUpdateRole = useCallback(
    async (roleId: string, request: RoleRequest): Promise<boolean> => {
      try {
        setSaving(true);
        const updatedRole = await updateRole(roleId, request);
        setRoles((prev) =>
          prev.map((r) => (r.name === roleId ? updatedRole : r))
        );
        addNotification({
          type: "success",
          title: "Success",
          message: `Role "${request.name}" updated successfully`,
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error.response?.data?.message || "Failed to update role",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Perform delete
  const performDelete = useCallback(
    async (roleId: string, roleName: string) => {
      try {
        setSaving(true);
        await deleteRole(roleId);
        setRoles((prev) => prev.filter((r) => r.name !== roleId));
        addNotification({
          type: "success",
          title: "Success",
          message: `Role "${roleName}" deleted successfully`,
        });
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error.response?.data?.message || "Failed to delete role",
        });
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Delete role with confirmation
  const handleDeleteRole = useCallback(
    (roleId: string, roleName: string) => {
      showConfirmDialog({
        title: "Delete Role",
        description: `Are you sure you want to delete role "${roleName}"? This action cannot be undone.`,
        variant: "destructive",
        confirmText: "Delete",
        onConfirm: confirmAndClose(() => performDelete(roleId, roleName)),
      });
    },
    [showConfirmDialog, confirmAndClose, performDelete]
  );

  return {
    // State
    roles,
    loading,
    saving,
    confirmDialog,

    // Actions
    loadData,
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
    closeConfirmDialog,
  };
}
