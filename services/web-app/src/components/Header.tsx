import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import { VideoCameraOutlined } from "@ant-design/icons";
import "../styles/App.css";

const Header: FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
        <Link
          to="/my-bookings"
          className={isActive("/my-bookings") ? "active" : ""}
        >
          My Bookings
        </Link>
      </nav>
    </header>
  );
};

export default Header;
