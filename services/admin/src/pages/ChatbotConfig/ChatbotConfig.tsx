import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  RefreshCcw,
  Upload,
  Trash2,
  FileText,
  ChevronDown,
  Eye,
  Star,
} from "lucide-react";
import { DOCUMENT_TYPES, STATUS_CONFIG } from "@/constants/chatbot";
import { AddDocumentModal } from "./AddDocumentModal";
import { DocumentDetailModal } from "./DocumentDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import {
  useChatbotDocuments,
  useChatbotSync,
  useChatbotFilters,
  useChatbotModals,
} from "../../hooks/chatbotDocumentHooks";

export default function ChatbotConfig() {
  // Custom hooks
  const {
    documents,
    loading,
    deleting,
    loadDocuments,
    handleDelete,
    handleToggleStatus,
  } = useChatbotDocuments();
  const { syncingIds, handleSync, handleResync } =
    useChatbotSync(loadDocuments);
  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredDocuments,
  } = useChatbotFilters(documents);
  const {
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    isDetailModalOpen,
    selectedDocument,
    openDetailModal,
    closeDetailModal,
    deleteDialogOpen,
    selectedDocId,
    openDeleteDialog,
    closeDeleteDialog,
    syncDialogOpen,
    pendingSyncId,
    openSyncDialog,
    closeSyncDialog,
    resyncDialogOpen,
    openResyncDialog,
    closeResyncDialog,
    togglingIds,
    setTogglingIds,
  } = useChatbotModals();

  const getDocumentTypeConfig = (type: string) => {
    return DOCUMENT_TYPES.find((t) => t.value === type) || DOCUMENT_TYPES[0];
  };

  const handleToggleStatusWithLoading = async (documentId: string) => {
    setTogglingIds((prev) => new Set([...prev, documentId]));
    await handleToggleStatus(documentId);
    setTogglingIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(documentId);
      return newSet;
    });
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocId) return;
    const success = await handleDelete(selectedDocId);
    if (success) {
      closeDeleteDialog();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chatbot Configuration"
        description="Manage documents for AI chatbot knowledge base"
      />

      {/* Search and Add Button */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search documents by name or description..."
        totalCount={documents.length}
        filteredCount={filteredDocuments.length}
        icon={<FileText className="w-4 h-4" />}
        label="documents"
        buttonText="Add Document"
        onAddClick={openAddModal}
      />

      {/* Filters Bar */}
      <div className="flex items-center gap-2">
        {/* Type Filter */}
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Types</option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Status</option>
            {Object.keys(STATUS_CONFIG).map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Documents Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner
              message="Loading documents..."
              size="lg"
              fullScreen={false}
            />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              {searchQuery.trim()
                ? `No documents found matching "${searchQuery}"`
                : "No documents found"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left font-semibold text-sm p-3 min-w-[250px]">
                    Document
                  </th>
                  <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                    Type
                  </th>
                  <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                    Priority
                  </th>
                  <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                    Status
                  </th>
                  <th className="text-left font-semibold text-sm p-3 min-w-[80px]">
                    Chunks
                  </th>
                  <th className="text-left font-semibold text-sm p-3 min-w-[150px]">
                    Last Synced
                  </th>
                  <th className="text-right font-semibold text-sm p-3 min-w-[150px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc, index) => (
                  <tr
                    key={doc.id}
                    className={`border-b border-border hover:bg-accent/50 transition-colors ${
                      index === filteredDocuments.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-foreground">
                          📄 {doc.file?.originalFileName || "Unknown"}
                        </div>
                        {doc.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {doc.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={
                          getDocumentTypeConfig(doc.documentType).className
                        }
                      >
                        {doc.documentType}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: doc.priority }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500" />
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={STATUS_CONFIG[doc.documentStatus].className}
                      >
                        {STATUS_CONFIG[doc.documentStatus].label}
                      </Badge>
                      {doc.syncError && (
                        <div className="text-xs text-red-600 mt-1">
                          {doc.syncError}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-foreground">
                      {doc.chunksCount || 0}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {doc.syncedAt
                        ? new Date(doc.syncedAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        {/* View Detail */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailModal(doc)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Sync Button - Only for INACTIVE (first time sync) */}
                        {doc.documentStatus === "INACTIVE" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openSyncDialog(doc.id)}
                            disabled={syncingIds.has(doc.id)}
                            title="Sync to Vector Store"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            {syncingIds.has(doc.id) ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </Button>
                        )}

                        {/* Re-sync Button - For ACTIVE or FAILED */}
                        {(doc.documentStatus === "ACTIVE" ||
                          doc.documentStatus === "FAILED") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openResyncDialog(doc.id)}
                            disabled={syncingIds.has(doc.id)}
                            title={
                              doc.documentStatus === "FAILED"
                                ? "Retry Sync"
                                : "Re-sync Document"
                            }
                            className={
                              doc.documentStatus === "FAILED"
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            }
                          >
                            {syncingIds.has(doc.id) ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <RefreshCcw className="w-4 h-4" />
                            )}
                          </Button>
                        )}

                        {/* Toggle Status */}
                        {doc.documentStatus !== "PROCESSING" && (
                          <div
                            className="flex items-center"
                            title="Toggle Active/Inactive"
                          >
                            {togglingIds.has(doc.id) ? (
                              <div className="w-9 h-5 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (
                              <Switch
                                checked={doc.documentStatus === "ACTIVE"}
                                onCheckedChange={() =>
                                  handleToggleStatusWithLoading(doc.id)
                                }
                                disabled={togglingIds.has(doc.id)}
                              />
                            )}
                          </div>
                        )}

                        {/* Delete */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(doc.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Document Modal */}
      <AddDocumentModal
        open={isAddModalOpen}
        onClose={closeAddModal}
        onSuccess={() => {
          closeAddModal();
          loadDocuments();
        }}
      />

      {/* Document Detail Modal */}
      <DocumentDetailModal
        open={isDetailModalOpen}
        onClose={closeDetailModal}
        document={selectedDocument}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
        variant="destructive"
      />

      {/* Sync Confirmation Dialog */}
      <ConfirmDialog
        isOpen={syncDialogOpen}
        onClose={closeSyncDialog}
        onConfirm={() => {
          if (pendingSyncId) {
            handleSync(pendingSyncId);
          }
          closeSyncDialog();
        }}
        title="Sync Document"
        description="Are you sure you want to sync this document to the vector store? This will process the document and make it available for the chatbot."
        confirmText="Sync"
        loading={pendingSyncId ? syncingIds.has(pendingSyncId) : false}
        variant="default"
      />

      {/* Re-sync Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resyncDialogOpen}
        onClose={closeResyncDialog}
        onConfirm={() => {
          if (pendingSyncId) {
            handleResync(pendingSyncId);
          }
          closeResyncDialog();
        }}
        title="Re-sync Document"
        description="Are you sure you want to re-sync this document? This will reprocess the document and update the vector store."
        confirmText="Re-sync"
        loading={pendingSyncId ? syncingIds.has(pendingSyncId) : false}
        variant="default"
      />
    </div>
  );
}
