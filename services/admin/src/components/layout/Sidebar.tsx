import {
  Film,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
  ShieldCheck,
  DollarSign,
  Clock,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useThemeStore } from "@/stores/useThemeStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { logOut } from "@/services/authenticationService";
import { MENU_ITEMS } from "@/constants/menuItems";
import { usePermissions } from "@/hooks/usePermissions";
import { useEffect, useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";

export function Sidebar() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const settingsOpen = useSidebarStore((state) => state.settingsOpen);
  const toggleSettings = useSidebarStore((state) => state.toggleSettings);
  const { hasAnyPermission } = usePermissions();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Filter menu items based on user permissions
  const visibleMenuItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      // If no permissions required, show the item
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true;
      }
      // Check if user has any of the required permissions
      return hasAnyPermission(item.requiredPermissions);
    });
  }, [hasAnyPermission]);

  // Automatically open a submenu if the current path matches one of its children
  useEffect(() => {
    const activeParent = MENU_ITEMS.find((item) =>
      item.children?.some(
        (child) =>
          child.path &&
          location.pathname.toLowerCase().startsWith(child.path.toLowerCase()),
      ),
    );
    if (activeParent) {
      setOpenMenu(activeParent.id);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logOut();
    window.location.href = `${ROUTES.LOGIN}`;
  };

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar h-screen flex flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 flex-shrink-0">
        <Film className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">
          Cinema Manager
        </span>
      </div>

      <nav className="space-y-1 p-4 overflow-y-auto flex-1">
        <div className="mb-4">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Management
          </p>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              const visibleChildren = item.children!.filter((child) => {
                if (
                  !child.requiredPermissions ||
                  child.requiredPermissions.length === 0
                ) {
                  return true;
                }
                return hasAnyPermission(child.requiredPermissions);
              });

              if (visibleChildren.length === 0) return null;

              return (
                <div key={item.id}>
                  <button
                    onClick={() =>
                      setOpenMenu((prev) => (prev === item.id ? null : item.id))
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {openMenu === item.id ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>

                  {openMenu === item.id && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                      {visibleChildren.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.id}
                            to={child.path!}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                              )
                            }
                          >
                            <ChildIcon className="h-3.5 w-3.5" />
                            {child.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.id}
                to={item.path!}
                end={item.id === "overview"}
                className={({ isActive }) =>
                  cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div className="pt-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            title={`Chuyển sang ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {/* Settings with submenu */}
          <div>
            <button
              onClick={toggleSettings}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
              {settingsOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </button>

            {/* Submenu items */}
            {settingsOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                <NavLink
                  to={ROUTES.SETTINGS_PROFILE}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )
                  }
                >
                  <User className="h-3.5 w-3.5" />
                  Profile
                </NavLink>

                {/* <NavLink
                  to={ROUTES.SETTINGS_NOTIFICATIONS}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )
                  }
                >
                  <Bell className="h-3.5 w-3.5" />
                  Notifications
                </NavLink>

                <NavLink
                  to={ROUTES.SETTINGS_SECURITY}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )
                  }
                >
                  <Shield className="h-3.5 w-3.5" />
                  Security
                </NavLink> */}

                {/* Roles - only show if user has permission */}
                {hasAnyPermission(["ROLE_READ"]) && (
                  <NavLink
                    to={ROUTES.ROLES}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                      )
                    }
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Roles
                  </NavLink>
                )}

                {/* Permissions - only show if user has permission */}
                {hasAnyPermission(["PERMISSION_READ"]) && (
                  <NavLink
                    to={ROUTES.PERMISSIONS}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                      )
                    }
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Permissions
                  </NavLink>
                )}

                {/* Seat Prices */}
                <NavLink
                  to={ROUTES.SEAT_PRICES}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )
                  }
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Seat Prices
                </NavLink>

                {/* Buffer */}
                <NavLink
                  to={ROUTES.SETTINGS_BUFFER}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )
                  }
                >
                  <Clock className="h-3.5 w-3.5" />
                  Buffer
                </NavLink>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}
