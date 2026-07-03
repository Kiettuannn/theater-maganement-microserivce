import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getNotificationById } from "@/services/notificationService";
import type { Notification } from "@/types/NotificationType/Notification";
import { useNotificationStore } from "@/stores";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { statusConfig, priorityConfig } from "@/constants/notificationConfig";

export const ViewNotification = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.NOTIFICATIONS_LIST);
      return;
    }

    const loadNotification = async () => {
      try {
        setLoading(true);
        const data = await getNotificationById(id);
        setNotification(data);
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message:
            error?.response?.data?.message || "Failed to load notification",
        });
        navigate(ROUTES.NOTIFICATIONS_LIST);
      } finally {
        setLoading(false);
      }
    };

    loadNotification();
  }, [id, navigate, addNotification]);

  if (loading) {
    return <LoadingSpinner message="Loading notification..." />;
  }

  if (!notification) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Details"
        description={`View details for notification: ${notification.title}`}
      />

      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Title</p>
              <p className="font-medium text-lg">{notification.title}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {(() => {
                const status =
                  statusConfig[
                    notification.status as keyof typeof statusConfig
                  ];
                return (
                  <Badge variant="secondary" className={status.className}>
                    {status.label}
                  </Badge>
                );
              })()}
            </div>

            <div className="col-span-2">
              <p className="text-sm text-muted-foreground mb-2">Content</p>
              <div className="bg-muted/30 p-4 rounded-md border border-border">
                <div
                  className="text-sm prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: notification.content }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Category</p>
              <p className="text-sm">{notification.category}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Priority</p>
              {(() => {
                const priority =
                  priorityConfig[
                    notification.priority as keyof typeof priorityConfig
                  ];
                return (
                  <Badge variant="secondary" className={priority.className}>
                    {priority.label}
                  </Badge>
                );
              })()}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Recipient Type
              </p>
              <p className="text-sm">{notification.recipientType}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Recipient ID</p>
              <p className="font-mono text-sm">{notification.recipientId}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Template Code
              </p>
              <p className="font-mono text-sm">{notification.templateCode}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Created At</p>
              <p className="text-sm">
                {format(new Date(notification.createdAt), "MMM dd, yyyy HH:mm")}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Read Status</p>
              <Badge
                variant={notification.isRead ? "default" : "secondary"}
                className="text-sm"
              >
                {notification.isRead ? "Read" : "Unread"}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Read At</p>
              <p className="text-sm">
                {notification.readAt
                  ? format(new Date(notification.readAt), "MMM dd, yyyy HH:mm")
                  : "Not read yet"}
              </p>
            </div>
          </div>

          {/* Delivery Logs */}
          {notification.logs && notification.logs.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Delivery Logs
              </p>
              <div className="space-y-2">
                {notification.logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 bg-muted/20"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">
                        {log.channelName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sent: {format(new Date(log.sentAt), "MMM dd, yyyy HH:mm")}
                    </p>
                    {log.providerResponse && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Provider Response:
                        </p>
                        <pre className="text-xs bg-background p-2 rounded border border-border overflow-auto">
                          {JSON.stringify(log.providerResponse, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {notification.metadata &&
            Object.keys(notification.metadata).length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Metadata</p>
                <div className="bg-muted/30 p-4 rounded-md border border-border">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(notification.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-6 border-t mt-6">
          <Button
            onClick={() => navigate(ROUTES.NOTIFICATIONS_LIST)}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Notifications
          </Button>
        </div>
      </Card>
    </div>
  );
};
