import { useState } from "react";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { chatbotConfigService } from "@/services/chatbotConfigService";

export function useChatbotSync(onSyncComplete?: () => void) {
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const { addNotification } = useNotificationStore();

  const handleSync = async (documentId: string) => {
    try {
      setSyncingIds((prev) => new Set([...prev, documentId]));
      await chatbotConfigService.syncDocument(documentId);
      addNotification({
        type: "success",
        title: "Success",
        message: "Document sync started",
      });
      setTimeout(() => {
        onSyncComplete?.();
      }, 1000);
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to sync document",
      });
    } finally {
      setSyncingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleResync = async (documentId: string) => {
    try {
      setSyncingIds((prev) => new Set([...prev, documentId]));
      await chatbotConfigService.resyncDocument(documentId);
      addNotification({
        type: "success",
        title: "Success",
        message: "Document re-sync started",
      });
      setTimeout(() => {
        onSyncComplete?.();
      }, 1000);
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to re-sync document",
      });
    } finally {
      setSyncingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  return {
    syncingIds,
    handleSync,
    handleResync,
  };
}
