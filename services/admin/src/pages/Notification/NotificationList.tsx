import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { NotificationTable } from "@/components/notifications/NotificationTable";
import { useNotificationManager } from "@/hooks/useNotificationManager";
import type { Notification } from "@/types/NotificationType/Notification";
import { Search, X, Bell } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { PageHeader } from "@/components/ui/PageHeader";

export const NotificationList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const {
    notifications,
    loading,
    confirmDialog,
    loadData,
    handleDeleteNotification,
    closeConfirmDialog,
  } = useNotificationManager();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter notifications based on search query
  useEffect(() => {
    if (!Array.isArray(notifications)) {
      setFilteredNotifications([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredNotifications(notifications);
    } else {
      const filtered = notifications.filter((notification) => {
        try {
          if (!notification) return false;

          const title = (notification.title || "").toLowerCase();
          const content = (notification.content || "").toLowerCase();
          const category = (notification.category || "").toLowerCase();
          const status = (notification.status || "").toLowerCase();
          const query = searchQuery.toLowerCase();

          return (
            title.includes(query) ||
            content.includes(query) ||
            category.includes(query) ||
            status.includes(query)
          );
        } catch (error) {
          console.error("Error filtering notification:", notification, error);
          return false;
        }
      });
      setFilteredNotifications(filtered);
    }
  }, [notifications, searchQuery]);

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    let aValue: any = a[sortField as keyof Notification];
    let bValue: any = b[sortField as keyof Notification];

    // Handle date fields
    if (sortField === "createdAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Handle string fields
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleOpenSendDialog = () => {
    navigate(ROUTES.NOTIFICATIONS_SEND);
  };

  const handleViewNotification = (notification: Notification) => {
    navigate(ROUTES.NOTIFICATIONS_VIEW.replace(":id", notification.id));
  };

  const handleDelete = (notification: Notification) => {
    handleDeleteNotification(notification.id, notification.title || "Untitled");
  };

  if (loading) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Manage and send notifications to users"
      />

      <div className="space-y-4">
        {/* Search and Actions Bar */}
        <SearchAddBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search by title, content, category, or status..."
          totalCount={notifications.length}
          filteredCount={filteredNotifications.length}
          icon={<Bell className="w-4 h-4" />}
          label="notifications"
          buttonText="Send Notification"
          onAddClick={handleOpenSendDialog}
        />

        {/* Notification Table */}
        {searchQuery.trim() &&
        filteredNotifications.length === 0 &&
        !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No notifications found
            </h3>
            <p className="text-muted-foreground mb-4">
              No notifications match your search for "{searchQuery}"
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Clear search
            </Button>
          </div>
        ) : (
          <NotificationTable
            notifications={sortedNotifications}
            isLoading={loading}
            onView={handleViewNotification}
            onDelete={handleDelete}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeConfirmDialog}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText || "Confirm"}
          cancelText="Cancel"
          variant={confirmDialog.variant || "destructive"}
          loading={confirmDialog.loading}
        />
      </div>
    </div>
  );
};
