"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
}) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl"
          >
            <div className="p-6">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
                <h3
                  id="confirm-dialog-title"
                  className="mb-2 text-xl font-bold text-zinc-200"
                >
                  {title}
                </h3>
                <p className="whitespace-pre-wrap text-sm text-zinc-400">
                  {message}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirm();
                  }}
                  disabled={isLoading}
                  className={`w-full rounded-lg py-3 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    confirmVariant === "danger"
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-sky-600 text-white hover:bg-sky-500"
                  }`}
                >
                  {isLoading ? "Loading..." : confirmLabel}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-zinc-800 py-3 font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
