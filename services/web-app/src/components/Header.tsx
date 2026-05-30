import { FC, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserOutlined, VideoCameraOutlined } from "@ant-design/icons";
import type { AuthSession } from "../lib/auth";
import { getAuthSession } from "../lib/auth";
import LoginModal from "./LoginModal";
import "../styles/App.css";

const Header: FC = () => {
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() =>
    getAuthSession(),
  );

  useEffect(() => {
    setSession(getAuthSession());
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const isSignedIn = Boolean(session?.accessToken);

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setLoginOpen(false);
  };

  return (
    <header className="app-header">
      <Link to="/" className="header-logo">
        <VideoCameraOutlined style={{ marginRight: "8px" }} />
        CinemaFlex
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
            className="user-menu-trigger"
            aria-label="User menu"
          >
            <UserOutlined />
          </button>
          <div className="user-menu-dropdown">
            <Link to="/my-bookings" className="user-menu-item">
              My Bookings
            </Link>
            {isSignedIn ? (
              <>
                <Link to="/profile" className="user-menu-item">
                  Profile
                </Link>
                <Link to="/settings" className="user-menu-item">
                  Settings
                </Link>
                <Link to="/sign-out" className="user-menu-signout">
                  Sign Out
                </Link>
              </>
            ) : (
              <button
                type="button"
                className="user-menu-item"
                onClick={() => setLoginOpen(true)}
              >
                Sign In
              </button>
            )}
          </div>
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
