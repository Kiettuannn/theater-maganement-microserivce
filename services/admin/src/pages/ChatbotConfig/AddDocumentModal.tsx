import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Star } from "lucide-react";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { chatbotConfigService } from "@/services/chatbotConfigService";
import { getAllMediaFiles } from "@/services/mediaService";
import type { MediaFile } from "@/types/media.types";

interface AddDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  { value: "POLICY", label: "Policy" },
  { value: "HANDBOOK", label: "Handbook" },
  { value: "GUIDELINE", label: "Guideline" },
  { value: "FAQ", label: "FAQ" },
];

export function AddDocumentModal({
  open,
  onClose,
  onSuccess,
}: AddDocumentModalProps) {
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("POLICY");
  const [priority, setPriority] = useState<number>(1);
  const [description, setDescription] = useState<string>("");
  const [syncImmediately, setSyncImmediately] = useState<boolean>(true);
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addNotification } = useNotificationStore();

  // Load media files khi mở modal
  useEffect(() => {
    if (open) {
      loadMediaFiles();
    }
  }, [open]);

  const loadMediaFiles = async () => {
    try {
      setLoadingFiles(true);
      const files = await getAllMediaFiles();
      // Lọc chỉ lấy file PDF
      const pdfFiles = files.filter(
        (file) =>
          file.contentType === "application/pdf" ||
          file.originalFileName?.toLowerCase().endsWith(".pdf")
      );
      setMediaFiles(pdfFiles);
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to load media files",
      });
    } finally {
      setLoadingFiles(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedFileId) {
      newErrors.file = "Please select a file";
    }
    if (!documentType) {
      newErrors.documentType = "Please select document type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setUploading(true);

      // Add document to chatbot với file đã upload
      await chatbotConfigService.addDocument({
        fileId: selectedFileId,
        documentType: documentType as any,
        priority,
        description: description || undefined,
        syncImmediately,
      });

      addNotification({
        type: "success",
        title: "Success",
        message: syncImmediately
          ? "Document added and sync started"
          : "Document added successfully",
      });

      // Reset form
      setSelectedFileId("");
      setDocumentType("POLICY");
      setPriority(1);
      setDescription("");
      setSyncImmediately(true);
      setErrors({});

      onSuccess();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to add document",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Add Document"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Select PDF File *
          </label>
          {loadingFiles ? (
            <div className="flex items-center justify-center h-20 border border-input rounded-md bg-muted/50">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading files...
              </span>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 border border-dashed border-input rounded-md bg-muted/30">
              <FileText className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No PDF files found in media
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please upload PDF files in Media page first
              </p>
            </div>
          ) : (
            <Select
              value={selectedFileId}
              onValueChange={(value) => {
                setSelectedFileId(value);
                if (errors.file) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.file;
                    return newErrors;
                  });
                }
              }}
              disabled={uploading}
            >
              <SelectTrigger
                className={`mt-1.5 ${errors.file ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="Select a PDF file" />
              </SelectTrigger>
              <SelectContent>
                {mediaFiles.map((file) => (
                  <SelectItem key={file.id} value={file.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">
                        {file.originalFileName || `File ${file.id}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.file && (
            <p className="text-xs text-destructive mt-1">{errors.file}</p>
          )}
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Document Type *
          </label>
          <Select
            value={documentType}
            onValueChange={setDocumentType}
            disabled={uploading}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Priority *
          </label>
          <div className="flex items-center gap-2 mt-1.5">
            <Input
              id="priority"
              type="number"
              min={1}
              max={10}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              disabled={uploading}
              className="w-24"
            />
            <div className="flex items-center gap-1">
              {Array.from({ length: priority }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              (1=High, 10=Low)
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Description
          </label>
          <Input
            id="description"
            type="text"
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
            className="mt-1.5"
          />
        </div>

        {/* Sync Immediately */}
        <div className="flex items-center gap-2">
          <input
            id="syncImmediately"
            type="checkbox"
            checked={syncImmediately}
            onChange={(e) => setSyncImmediately(e.target.checked)}
            disabled={uploading}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label
            htmlFor="syncImmediately"
            className="text-sm cursor-pointer text-foreground"
          >
            Sync immediately after upload
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={uploading || !selectedFileId}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Document"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
