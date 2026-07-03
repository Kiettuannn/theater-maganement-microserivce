import { Button } from "@/components/ui/button";
import {
  Eye,
  Trash2,
  Bell,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Notification } from "@/types/NotificationType/Notification";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  statusConfig,
  priorityConfig,
  categoryConfig,
} from "@/constants/notificationConfig";

interface NotificationTableProps {
  notifications: Notification[];
  isLoading?: boolean;
  onView?: (notification: Notification) => void;
  onDelete?: (notification: Notification) => void;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export function NotificationTable({
  notifications,
  isLoading = false,
  onView,
  onDelete,
  onSort,
  sortField,
  sortDirection,
}: NotificationTableProps) {
  const SortButton = ({ field, label }: { field: string; label: string }) => {
    const isActive = sortField === field;
    const Icon = !isActive
      ? ArrowUpDown
      : sortDirection === "asc"
        ? ArrowUp
        : ArrowDown;

    return (
      <button
        onClick={() => onSort?.(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        disabled={!onSort}
      >
        <span>{label}</span>
        {onSort && (
          <Icon
            className={cn(
              "w-4 h-4",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
          />
        )}
      </button>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            Loading notifications...
          </div>
        </div>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <div className="p-12 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No notifications found</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left font-semibold text-sm p-3 min-w-[250px]">
                <SortButton field="title" label="Title" />
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                <SortButton field="category" label="Category" />
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                <SortButton field="status" label="Status" />
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                <SortButton field="priority" label="Priority" />
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[150px]">
                Recipient
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[150px]">
                <SortButton field="createdAt" label="Created At" />
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification, index) => {
              const status =
                statusConfig[notification.status as keyof typeof statusConfig];
              const priority =
                priorityConfig[
                  notification.priority as keyof typeof priorityConfig
                ];
              const category =
                categoryConfig[
                  notification.category as keyof typeof categoryConfig
                ];

              return (
                <tr
                  key={notification.id}
                  className={cn(
                    "border-b border-border hover:bg-accent/50 transition-colors",
                    index === notifications.length - 1 && "border-b-0",
                  )}
                >
                  {/* Title */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground line-clamp-1">
                        {notification.title || "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {notification.content}
                      </p>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{category.label}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <Badge variant="secondary" className={status.className}>
                      {status.label}
                    </Badge>
                  </td>

                  {/* Priority */}
                  <td className="p-3">
                    <Badge variant="secondary" className={priority.className}>
                      {priority.label}
                    </Badge>
                  </td>

                  {/* Recipient */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {notification.recipientType}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                        {notification.recipientId}
                      </p>
                    </div>
                  </td>

                  {/* Created At */}
                  <td className="p-3">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(notification.createdAt), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), "HH:mm")}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(notification)}
                          title="View details"
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(notification)}
                          className="text-destructive hover:text-destructive cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
