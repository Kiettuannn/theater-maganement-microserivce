import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChatbotDocument } from "@/services/chatbotConfigService";
import { FileText, Calendar, Database, User, AlertCircle } from "lucide-react";
import { Star } from "lucide-react";
import { DOCUMENT_TYPE_CONFIG, STATUS_CONFIG } from "@/constants/chatbot";

interface DocumentDetailModalProps {
  open: boolean;
  onClose: () => void;
  document: ChatbotDocument | null;
}

export function DocumentDetailModal({
  open,
  onClose,
  document,
}: DocumentDetailModalProps) {
  if (!document) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Document Details"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* File Information Section */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                {document.file?.originalFileName || "Unknown File"}
              </h3>
              <div className="text-sm text-muted-foreground">
                {document.file?.contentType || "N/A"} •{" "}
                {formatFileSize(document.file?.size || 0)}
              </div>
              {document.file?.url && (
                <a
                  href={document.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-1 inline-block"
                >
                  View File →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Document Metadata */}
        <div className="grid grid-cols-2 gap-4">
          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Document Type
            </label>
            <Badge
              variant="outline"
              className={DOCUMENT_TYPE_CONFIG[document.documentType].className}
            >
              {DOCUMENT_TYPE_CONFIG[document.documentType].label}
            </Badge>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Status
            </label>
            <Badge
              variant="outline"
              className={STATUS_CONFIG[document.documentStatus].className}
            >
              {STATUS_CONFIG[document.documentStatus].label}
            </Badge>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Priority
            </label>
            <div className="flex items-center gap-1">
              {Array.from({ length: document.priority }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500" />
              ))}
              <span className="text-sm text-muted-foreground ml-2">
                ({document.priority}/10)
              </span>
            </div>
          </div>

          {/* Chunks Count */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              <Database className="w-4 h-4 inline mr-1" />
              Chunks Count
            </label>
            <div className="text-foreground font-medium">
              {document.chunksCount || 0} chunks
            </div>
          </div>
        </div>

        {/* Description */}
        {document.description && (
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Description
            </label>
            <div className="p-3 bg-muted/30 rounded-md text-foreground">
              {document.description}
            </div>
          </div>
        )}

        {/* Sync Information */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3 text-foreground">
            Synchronization Info
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 inline mr-1" />
                Last Synced
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatDate(document.syncedAt)}
              </span>
            </div>
            {document.syncedBy && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  <User className="w-4 h-4 inline mr-1" />
                  Synced By
                </span>
                <span className="text-sm font-medium text-foreground">
                  {document.syncedBy}
                </span>
              </div>
            )}
            {document.progressPercentage !== null &&
              document.progressPercentage !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Progress
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {document.progressPercentage}%
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Error Message */}
        {document.syncError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-red-900 mb-1">
                  Sync Error
                </h4>
                <p className="text-sm text-red-700">{document.syncError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3 text-foreground">
            Timestamps
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">File Uploaded:</span>
              <div className="font-medium text-foreground mt-1">
                {formatDate(document.file?.uploadDate)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Added to Chatbot:</span>
              <div className="font-medium text-foreground mt-1">
                {formatDate(document.addedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
