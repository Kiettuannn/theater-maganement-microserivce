import { useState } from "react";
import type { ChatbotDocument } from "@/services/chatbotConfigService";

export function useChatbotModals() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [resyncDialogOpen, setResyncDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<ChatbotDocument | null>(null);
  const [pendingSyncId, setPendingSyncId] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openDetailModal = (doc: ChatbotDocument) => {
    setSelectedDocument(doc);
    setIsDetailModalOpen(true);
  };
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDocument(null);
  };

  const openDeleteDialog = (docId: string) => {
    setSelectedDocId(docId);
    setDeleteDialogOpen(true);
  };
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedDocId(null);
  };

  const openSyncDialog = (docId: string) => {
    setPendingSyncId(docId);
    setSyncDialogOpen(true);
  };
  const closeSyncDialog = () => {
    setSyncDialogOpen(false);
    setPendingSyncId(null);
  };

  const openResyncDialog = (docId: string) => {
    setPendingSyncId(docId);
    setResyncDialogOpen(true);
  };
  const closeResyncDialog = () => {
    setResyncDialogOpen(false);
    setPendingSyncId(null);
  };

  return {
    // Add Modal
    isAddModalOpen,
    openAddModal,
    closeAddModal,

    // Detail Modal
    isDetailModalOpen,
    selectedDocument,
    openDetailModal,
    closeDetailModal,

    // Delete Dialog
    deleteDialogOpen,
    selectedDocId,
    openDeleteDialog,
    closeDeleteDialog,

    // Sync Dialog
    syncDialogOpen,
    pendingSyncId,
    openSyncDialog,
    closeSyncDialog,

    // Resync Dialog
    resyncDialogOpen,
    openResyncDialog,
    closeResyncDialog,

    // Toggling state
    togglingIds,
    setTogglingIds,
  };
}
