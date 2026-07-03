import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore, selectIsAuthenticated } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionType } from "@/constants/permissions";
import { ROUTES } from "@/routes/routes";

interface ProtectedRouteProps {
  requiredPermissions?: PermissionType[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
}

function ProtectedRoute({
  requiredPermissions = [],
  requireAll = false,
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  const location = useLocation();

  // First check authentication
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If no permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return <Outlet />;
  }

  // Check permissions
  const hasPermission = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasPermission) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
