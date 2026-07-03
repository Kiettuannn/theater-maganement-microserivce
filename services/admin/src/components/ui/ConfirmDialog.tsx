import { type ReactNode } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4 p-6 animate-in fade-in-0 zoom-in-95">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        {variant === "destructive" && (
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-center">{title}</h2>
            <div className="text-sm text-muted-foreground text-center">
              {description}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 cursor-pointer"
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              variant={variant === "destructive" ? "destructive" : "default"}
              className="flex-1 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Deleting..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
