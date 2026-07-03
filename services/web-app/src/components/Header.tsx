import { FC, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { selectIsAuthenticated, useAuthStore } from "../stores";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useSocketIO } from "../hooks/useSocketIO";
import LoginModal from "./LoginModal";
import { Badge } from "antd";
import "../styles/App.css";

const Header: FC = () => {
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const isSignedIn = useAuthStore(selectIsAuthenticated);
  const { hasUnreadBooking } = useNotificationStore();

  useSocketIO();

  const isActive = (path: string) => location.pathname === path;
  const handleLoginSuccess = () => {
    setLoginOpen(false);
  };

  return (
    <header className="app-header">
      <Link to="/" className="header-logo">
        <VideoCameraOutlined style={{ marginRight: "8px" }} />
        Cinema2K
      </Link>
      <nav className="header-nav">
        <Link to="/" className={isActive("/") ? "active" : ""}>
          Now Showing
        </Link>
        <Link
          to="/coming-soon"
          className={isActive("/coming-soon") ? "active" : ""}
        >
          Coming Soon
        </Link>
        <div className="user-menu">
          <button
            type="button"
            className={`user-menu-trigger${
              isSignedIn ? "" : " user-menu-trigger--text"
            }`}
            aria-label={isSignedIn ? "User menu" : "Login"}
            onClick={
              isSignedIn
                ? undefined
                : () => {
                    setLoginOpen(true);
                  }
            }
          >
            <Badge dot={hasUnreadBooking}>
              {isSignedIn ? <UserOutlined style={{ fontSize: '18px' }} /> : "Sign In"}
            </Badge>
          </button>
          {isSignedIn && (
            <div className="user-menu-dropdown">
              <Link to="/my-bookings" className="user-menu-item">
                <Badge dot={hasUnreadBooking} offset={[10, 0]}>
                  My Bookings
                </Badge>
              </Link>
              <Link to="/profile" className="user-menu-item">
                Profile
              </Link>
              <Link to="/settings" className="user-menu-item">
                Settings
              </Link>
              <Link to="/sign-out" className="user-menu-signout">
                Sign Out
              </Link>
            </div>
          )}
        </div>
      </nav>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </header>
  );
};

export default Header;
