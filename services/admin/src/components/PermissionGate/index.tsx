import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionType } from "@/constants/permissions";

interface PermissionGateProps {
  children: ReactNode;
  requiredPermissions?: PermissionType[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  fallback?: ReactNode; // Optional fallback content when user doesn't have permission
}

/**
 * Component to conditionally render children based on user permissions
 *
 * @example
 * // Show button only if user has CREATE_MOVIE permission
 * <PermissionGate requiredPermissions={[PERMISSIONS.MOVIE_CREATE]}>
 *   <Button>Add Movie</Button>
 * </PermissionGate>
 *
 * @example
 * // Show button only if user has ALL specified permissions
 * <PermissionGate
 *   requiredPermissions={[PERMISSIONS.MOVIE_UPDATE, PERMISSIONS.MOVIE_READ]}
 *   requireAll
 * >
 *   <Button>Edit Movie</Button>
 * </PermissionGate>
 *
 * @example
 * // Show fallback content when user doesn't have permission
 * <PermissionGate
 *   requiredPermissions={[PERMISSIONS.MOVIE_DELETE]}
 *   fallback={<p>You don't have permission to delete movies</p>}
 * >
 *   <Button>Delete Movie</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  // If no permissions required, always show children
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Check permissions
  const hasPermission = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
