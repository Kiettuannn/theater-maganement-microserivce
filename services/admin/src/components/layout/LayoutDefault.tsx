import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function LayoutDefault() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-end">
          <NotificationBell />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
