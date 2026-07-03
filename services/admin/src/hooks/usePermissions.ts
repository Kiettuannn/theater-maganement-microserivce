import { useMemo } from 'react';
import { useAuthStore, selectPermissions } from '@/stores/useAuthStore';
import type { PermissionType } from '@/constants/permissions';

/**
 * Hook to check if user has specific permission(s)
 * Permissions are now stored as string codes directly from JWT scope (e.g., "BOOKING_DELETE", "COMBO_READ")
 */
export const usePermissions = () => {
  const permissions = useAuthStore(selectPermissions);

  // Permissions are already string codes, no need to extract names
  const permissionCodes = useMemo(() => permissions, [permissions]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: PermissionType): boolean => {
    return permissionCodes.includes(permission);
  };

  /**
   * Check if user has ANY of the specified permissions (OR logic)
   */
  const hasAnyPermission = (requiredPermissions: PermissionType[]): boolean => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }
    return requiredPermissions.some(permission => permissionCodes.includes(permission));
  };

  /**
   * Check if user has ALL of the specified permissions (AND logic)
   */
  const hasAllPermissions = (requiredPermissions: PermissionType[]): boolean => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }
    return requiredPermissions.every(permission => permissionCodes.includes(permission));
  };

  /**
   * Check if user has permission to access a specific route
   */
  const canAccessRoute = (requiredPermissions?: PermissionType[]): boolean => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required for this route
    }
    return hasAnyPermission(requiredPermissions);
  };

  return {
    permissions,
    permissionCodes,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
  };
};

/**
 * Helper function to check permissions outside of React components
 */
export const checkPermission = (permission: PermissionType): boolean => {
  const permissions = useAuthStore.getState().permissions;
  return permissions.includes(permission);
};

/**
 * Helper function to check multiple permissions outside of React components
 */
export const checkAnyPermission = (requiredPermissions: PermissionType[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  const permissions = useAuthStore.getState().permissions;
  return requiredPermissions.some(permission => permissions.includes(permission));
};

/**
 * Helper function to check all permissions outside of React components
 */
export const checkAllPermissions = (requiredPermissions: PermissionType[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  const permissions = useAuthStore.getState().permissions;
  return requiredPermissions.every(permission => permissions.includes(permission));
};
