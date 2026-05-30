import { ComponentType } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { selectIsAuthenticated, useAuthStore } from "../stores";
import { isAuthenticated as hasAuthToken } from "../services/auth";

interface PrivateRouteProps {
  redirectTo?: string;
  layout?: ComponentType;
}

function PrivateRoute({ redirectTo = "/", layout: Layout }: PrivateRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isSessionActive = Boolean(hasAuthToken());

  if (!isAuthenticated && !isSessionActive) {
    return <Navigate to={redirectTo} replace />;
  }

  if (Layout) {
    return <Layout />;
  }

  return <Outlet />;
}

export default PrivateRoute;
