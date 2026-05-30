import { FC } from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type LayoutVariant = "public" | "authenticated";

interface AppLayoutProps {
  variant?: LayoutVariant;
}

const AppLayout: FC<AppLayoutProps> = ({ variant = "public" }) => {
  const shellClass =
    variant === "authenticated"
      ? "app-shell app-shell--authenticated"
      : "app-shell";

  return (
    <div className={shellClass}>
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
