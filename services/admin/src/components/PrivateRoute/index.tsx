import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore, selectIsAuthenticated } from "@/stores";
import { ROUTES } from "@/constants/routes";

function PrivateRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} />;
}

export default PrivateRoute;
