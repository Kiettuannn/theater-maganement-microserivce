import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useNotificationStore } from "@/stores";
import {
  getAllNotificationLogs,
  deleteNotificationLog,
  getNotificationLogById,
} from "@/services/notificationService";
import type { NotificationLogDetail } from "@/services/notificationService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Search, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/PageHeader";

const channelConfig = {
  EMAIL: {
    label: "Email",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  IN_APP: {
    label: "In-App",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  SMS: {
    label: "SMS",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
};

export const LogList = () => {
  const [logs, setLogs] = useState<NotificationLogDetail[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<NotificationLogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<NotificationLogDetail | null>(
    null,
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const { confirmDialog, showConfirmDialog, closeConfirmDialog } =
    useConfirmDialog();

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter((log) => {
        const query = searchQuery.toLowerCase();
        return (
          log.notificationTitle.toLowerCase().includes(query) ||
          log.channelName.toLowerCase().includes(query) ||
          log.status.toLowerCase().includes(query)
        );
      });
      setFilteredLogs(filtered);
    }
  }, [logs, searchQuery]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Directly get all logs from the dedicated API endpoint
      const data = await getAllNotificationLogs();
      console.log("Fetched logs:", data);
      setLogs(data);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load logs",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (log: NotificationLogDetail) => {
    try {
      const detailData = await getNotificationLogById(log.id);
      setSelectedLog(detailData);
      setDetailModalOpen(true);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load log detail",
      });
    }
  };

  const handleDelete = (log: NotificationLogDetail) => {
    showConfirmDialog({
      title: "Delete Log",
      description: `Are you sure you want to delete this log for "${log.notificationTitle}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteNotificationLog(log.id);
          addNotification({
            type: "success",
            title: "Success",
            message: "Log deleted successfully",
          });
          loadLogs(); // Reload logs after deletion
        } catch (error: any) {
          addNotification({
            type: "error",
            title: "Error",
            message: error?.response?.data?.message || "Failed to delete log",
          });
        } finally {
          closeConfirmDialog();
        }
      },
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading logs..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notification Logs"
        description="View notification delivery history and status"
      />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notification</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Response</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.notificationTitle}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const channel =
                          channelConfig[
                            log.channelName as keyof typeof channelConfig
                          ];
                        if (channel) {
                          return (
                            <Badge
                              variant="secondary"
                              className={channel.className}
                            >
                              {channel.label}
                            </Badge>
                          );
                        }
                        return (
                          <Badge variant="outline">{log.channelName}</Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "SENT"
                            ? "default"
                            : log.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(log.sentAt), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      {log.providerResponse ? (
                        <span className="text-xs text-muted-foreground">
                          {JSON.stringify(log.providerResponse).substring(
                            0,
                            50,
                          )}
                          ...
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(log)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(log)}
                          className="text-destructive hover:text-destructive"
                          title="Delete log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detail Modal */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Log Details"
          maxWidth="3xl"
        >
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Log ID</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedLog.id}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Notification</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedLog.notificationTitle}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Notification ID</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedLog.notificationId}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Channel</h3>
                {(() => {
                  const channel =
                    channelConfig[
                      selectedLog.channelName as keyof typeof channelConfig
                    ];
                  if (channel) {
                    return (
                      <Badge variant="secondary" className={channel.className}>
                        {channel.label}
                      </Badge>
                    );
                  }
                  return (
                    <Badge variant="outline">{selectedLog.channelName}</Badge>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Status</h3>
                <Badge
                  variant={
                    selectedLog.status === "SENT"
                      ? "default"
                      : selectedLog.status === "FAILED"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {selectedLog.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Sent At</h3>
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(selectedLog.sentAt),
                    "MMMM dd, yyyy 'at' HH:mm:ss",
                  )}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Provider Response
                </h3>
                {selectedLog.providerResponse ? (
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[400px] whitespace-pre-wrap break-words">
                    {JSON.stringify(selectedLog.providerResponse, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No response data
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Confirm Dialog */}
        <ConfirmDialog {...confirmDialog} onClose={closeConfirmDialog} />
      </div>
    </div>
  );
};
