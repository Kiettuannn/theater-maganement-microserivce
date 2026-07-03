import { useState, useCallback } from "react";
import {
  getAllPermissions,
  createPermission,
  type Permission,
} from "@/services/permissionService";
import { getAllRoles, updateRole, type Role } from "@/services/roleService";
import { useNotificationStore } from "@/stores";
import { FEATURES, ACTIONS } from "@/constants/features";
import { useConfirmDialog } from "./useConfirmDialog";

export function usePermissionManager() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);
  
  const { confirmDialog, showConfirmDialog, closeConfirmDialog, confirmAndClose } = useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load permissions and roles
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [permissionsData, rolesData] = await Promise.all([
        getAllPermissions(),
        getAllRoles(),
      ]);
      setPermissions(permissionsData);
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

  // Sync permissions from server
  const handleSyncPermissions = useCallback(async () => {
    try {
      setSyncing(true);
      await loadData();
      addNotification({
        type: "success",
        title: "Success",
        message: "Permissions synced successfully",
      });
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to sync permissions",
      });
    } finally {
      setSyncing(false);
    }
  }, [loadData, addNotification]);

  // Check if a role has a specific permission
  const roleHasPermission = useCallback(
    (role: Role, permissionName: string): boolean => {
      return role.permissions.some((p) => p.name === permissionName);
    },
    []
  );

  // Perform the actual bulk toggle operation
  const performToggleAllForRole = useCallback(
    async (role: Role, enable: boolean, featureId?: string) => {
      try {
        setUpdatingCell(`bulk-${role.name}-${featureId || "all"}`);

        let newPermissions: string[];
        if (featureId) {
          // Toggle all permissions for specific feature
          const featurePermissions = ACTIONS.map(
            (action) => `${featureId}_${action.id}`
          );

          if (enable) {
            const existingPermissions = role.permissions.map((p) => p.name);
            newPermissions = [
              ...new Set([...existingPermissions, ...featurePermissions]),
            ];
          } else {
            newPermissions = role.permissions
              .filter((p) => !featurePermissions.includes(p.name))
              .map((p) => p.name);
          }
        } else {
          // Toggle all permissions for role
          if (enable) {
            newPermissions = FEATURES.flatMap((feature) =>
              ACTIONS.map((action) => `${feature.id}_${action.id}`)
            );
          } else {
            newPermissions = [];
          }
        }

        // Create permissions that don't exist
        for (const permName of newPermissions) {
          if (!permissions.some((p) => p.name === permName)) {
            // Split from the last underscore to get action
            const lastUnderscoreIndex = permName.lastIndexOf("_");
            const fId = permName.substring(0, lastUnderscoreIndex);
            const action = permName.substring(lastUnderscoreIndex + 1);
            const feature = FEATURES.find((f) => f.id === fId);
            const actionInfo = ACTIONS.find((a) => a.id === action);
            if (feature && actionInfo) {
              await createPermission({
                name: permName,
                description: `${actionInfo.label} ${feature.label.toLowerCase()}`,
              });
            }
          }
        }

        // Optimistically update UI
        setRoles((prevRoles) =>
          prevRoles.map((r) =>
            r.name === role.name
              ? {
                  ...r,
                  permissions: newPermissions.map((name) => ({
                    name,
                    description:
                      permissions.find((p) => p.name === name)?.description ||
                      "",
                  })),
                }
              : r
          )
        );

        await updateRole(role.name, {
          name: role.name,
          description: role.description,
          permissions: newPermissions,
        });

        addNotification({
          type: "success",
          title: "Success",
          message: `Permissions ${enable ? "enabled" : "disabled"} for ${
            role.description || role.name
          }`,
        });
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message:
            error.response?.data?.message || "Failed to update permissions",
        });
        // Rollback on error
        await loadData();
      } finally {
        setUpdatingCell(null);
      }
    },
    [permissions, addNotification, loadData]
  );

  // Toggle all permissions for a role with confirmation
  const handleToggleAllForRole = useCallback(
    (role: Role, enable: boolean, featureId?: string) => {
      const feature = FEATURES.find((f) => f.id === featureId);
      const featureName = feature ? feature.label : "all features";

      showConfirmDialog({
        title: enable ? "Add All Permissions" : "Remove All Permissions",
        description: `Are you sure you want to ${
          enable ? "add" : "remove"
        } all permissions for ${featureName} ${enable ? "to" : "from"} ${
          role.description || role.name
        }?`,
        variant: enable ? "default" : "destructive",
        confirmText: enable ? "Add All" : "Remove All",
        onConfirm: confirmAndClose(() => performToggleAllForRole(role, enable, featureId)),
      });
    },
    [performToggleAllForRole, showConfirmDialog, confirmAndClose]
  );

  // Perform the actual toggle operation
  const performTogglePermission = useCallback(
    async (role: Role, permissionName: string, currentState: boolean) => {
      const cellKey = `${role.name}-${permissionName}`;

      if (updatingCell === cellKey) return;

      try {
        setUpdatingCell(cellKey);

        // Ensure permission exists
        if (!permissions.some((p) => p.name === permissionName)) {
          // Split from the last underscore to get action
          const lastUnderscoreIndex = permissionName.lastIndexOf("_");
          const featureId = permissionName.substring(0, lastUnderscoreIndex);
          const action = permissionName.substring(lastUnderscoreIndex + 1);
          const feature = FEATURES.find((f) => f.id === featureId);
          const actionInfo = ACTIONS.find((a) => a.id === action);

          if (feature && actionInfo) {
            await createPermission({
              name: permissionName,
              description: `${actionInfo.label} ${feature.label.toLowerCase()}`,
            });
          }
        }

        // Update role permissions
        let newPermissions: string[];
        if (currentState) {
          // Remove permission
          newPermissions = role.permissions
            .filter((p) => p.name !== permissionName)
            .map((p) => p.name);
        } else {
          // Add permission
          newPermissions = [
            ...role.permissions.map((p) => p.name),
            permissionName,
          ];
        }

        // Optimistically update UI
        setRoles((prevRoles) =>
          prevRoles.map((r) =>
            r.name === role.name
              ? {
                  ...r,
                  permissions: newPermissions.map((name) => ({
                    name,
                    description:
                      permissions.find((p) => p.name === name)?.description ||
                      "",
                  })),
                }
              : r
          )
        );

        await updateRole(role.name, {
          name: role.name,
          description: role.description,
          permissions: newPermissions,
        });

        addNotification({
          type: "success",
          title: "Success",
          message: `Permission ${currentState ? "removed from" : "added to"} ${
            role.description || role.name
          }`,
        });
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message:
            error.response?.data?.message || "Failed to update permission",
        });
        // Rollback on error
        await loadData();
      } finally {
        setUpdatingCell(null);
      }
    },
    [updatingCell, permissions, addNotification, loadData]
  );

  // Handle toggle permission for a role
  const handleTogglePermission = useCallback(
    (role: Role, permissionName: string, currentState: boolean) => {
      // Get permission details for better message
      const lastUnderscoreIndex = permissionName.lastIndexOf("_");
      const featureId = permissionName.substring(0, lastUnderscoreIndex);
      const action = permissionName.substring(lastUnderscoreIndex + 1);
      const feature = FEATURES.find((f) => f.id === featureId);
      const actionInfo = ACTIONS.find((a) => a.id === action);
      const permissionLabel = actionInfo
        ? `${actionInfo.label} ${feature?.label || ""}`
        : permissionName;

      showConfirmDialog({
        title: currentState ? "Remove Permission" : "Add Permission",
        description: `Are you sure you want to ${
          currentState ? "remove" : "add"
        } "${permissionLabel}" ${currentState ? "from" : "to"} ${
          role.description || role.name
        }?`,
        variant: currentState ? "destructive" : "default",
        confirmText: currentState ? "Remove" : "Add",
        onConfirm: confirmAndClose(() => performTogglePermission(role, permissionName, currentState)),
      });
    },
    [performTogglePermission, showConfirmDialog, confirmAndClose]
  );

  return {
    // State
    permissions,
    roles,
    loading,
    syncing,
    updatingCell,
    confirmDialog,
    
    // Actions
    loadData,
    handleSyncPermissions,
    roleHasPermission,
    handleToggleAllForRole,
    handleTogglePermission,
    closeConfirmDialog,
  };
}
