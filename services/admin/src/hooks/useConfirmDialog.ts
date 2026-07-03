import { useState, useCallback } from "react";

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  confirmText?: string;
  loading?: boolean;
}

export function useConfirmDialog() {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "destructive",
    confirmText: "Confirm",
    loading: false,
  });

  const showConfirmDialog = useCallback((config: Omit<ConfirmDialogState, 'isOpen' | 'loading'>) => {
    setConfirmDialog({
      ...config,
      isOpen: true,
      loading: false,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false, loading: false }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setConfirmDialog((prev) => ({ ...prev, loading }));
  }, []);

  const confirmAndClose = useCallback((callback: () => void) => {
    return () => {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false, loading: false }));
      callback();
    };
  }, []);

  return {
    confirmDialog,
    showConfirmDialog,
    closeConfirmDialog,
    confirmAndClose,
    setLoading,
  };
}