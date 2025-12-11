"use client";

import { useState, useCallback } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

/**
 * Reusable confirm modal component for destructive actions.
 * Replaces native confirm() dialogs for consistent UX.
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-background border border-border rounded-lg p-4 max-w-sm w-full mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md font-medium bg-secondary text-foreground hover:bg-accent border border-border transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              danger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to use ConfirmModal with Promise-based API.
 * Returns [ConfirmModalComponent, confirm()] similar to native confirm().
 */
export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    resolve?: (value: boolean) => void;
  }>({
    title: "",
    message: "",
  });

  const confirm = useCallback(
    (options: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      danger?: boolean;
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfig({ ...options, resolve });
        setIsOpen(true);
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    config.resolve?.(true);
  }, [config]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    config.resolve?.(false);
  }, [config]);

  const ConfirmModalComponent = (
    <ConfirmModal
      isOpen={isOpen}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      danger={config.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return [ConfirmModalComponent, confirm] as const;
}
