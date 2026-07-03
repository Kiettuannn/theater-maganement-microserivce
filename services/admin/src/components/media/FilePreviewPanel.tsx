import type { MediaFile } from "@/types/media.types";
import {
  formatFileSize,
  isImageFile,
  isVideoFile,
} from "@/services/mediaService";
import { X, Download, Trash2, ExternalLink } from "lucide-react";
import { FileTypeIcon } from "./FileTypeIcon";
import { useNotificationStore } from "@/stores";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useState } from "react";

interface FilePreviewPanelProps {
  file: MediaFile | null;
  onClose: () => void;
  onDelete?: (fileId: string) => void;
}

export function FilePreviewPanel({
  file,
  onClose,
  onDelete,
}: FilePreviewPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  if (!file) return null;

  const fileName =
    file.originalFileName || file.url.split("/").pop() || "Unknown";
  const isImage = isImageFile(file.contentType);
  const isVideo = isVideoFile(file.contentType);

  const handleDownload = async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab
      window.open(file.url, "_blank");
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(file.url);
    addNotification({
      type: "success",
      title: "Success",
      message: "URL copied to clipboard!",
    });
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed top-0 left-0 w-screen h-screen bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in-right border-l border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">File Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-6">
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-6">
            {isImage ? (
              <img src={file.url} alt={fileName} className="w-full" />
            ) : isVideo ? (
              <video src={file.url} controls className="w-full" />
            ) : (
              <div className="flex items-center justify-center h-64">
                <FileTypeIcon
                  contentType={file.contentType}
                  className="w-24 h-24 text-gray-400"
                />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                File Name
              </label>
              <p className="text-sm text-gray-900 mt-1 break-words">
                {fileName}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                File Type
              </label>
              <p className="text-sm text-gray-900 mt-1">{file.contentType}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                File Size
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {formatFileSize(file.size)}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Upload Date
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(file.uploadDate).toLocaleString("en-US")}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                URL
              </label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-900 truncate flex-1">
                  {file.url}
                </p>
                <button
                  onClick={handleCopyUrl}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => window.open(file.url, "_blank")}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (onDelete && file) {
            onDelete(file.id);
            onClose();
            setShowDeleteConfirm(false);
          }
        }}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
