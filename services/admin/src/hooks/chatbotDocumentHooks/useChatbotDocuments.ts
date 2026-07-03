import { useState, useEffect } from "react";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  chatbotConfigService,
  type ChatbotDocument,
} from "@/services/chatbotConfigService";

export function useChatbotDocuments() {
  const [documents, setDocuments] = useState<ChatbotDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { addNotification } = useNotificationStore();

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await chatbotConfigService.getAllDocuments();
      console.log("Fetched documents:", data);
      setDocuments(data);
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to load documents",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      setDeleting(true);
      await chatbotConfigService.deleteDocument(documentId);
      addNotification({
        type: "success",
        title: "Success",
        message: "Document deleted successfully",
      });
      await loadDocuments();
      return true;
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete document",
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (documentId: string) => {
    try {
      await chatbotConfigService.toggleDocumentStatus(documentId);
      addNotification({
        type: "success",
        title: "Success",
        message: "Document status updated",
      });
      await loadDocuments();
      return true;
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update status",
      });
      return false;
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  return {
    documents,
    loading,
    deleting,
    loadDocuments,
    handleDelete,
    handleToggleStatus,
  };
}
