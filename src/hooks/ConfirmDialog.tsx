// src/components/ui/ConfirmDialog.tsx
import React from "react";
import { Icons } from "../components/icons/IconMap";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: (
        <Icons.alertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
      ),
      iconBg: "bg-red-100 dark:bg-red-900/30",
      button:
        "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
    },
    warning: {
      icon: (
        <Icons.alertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
      ),
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      button:
        "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700",
    },
    info: {
      icon: (
        <Icons.info className="w-12 h-12 text-blue-600 dark:text-blue-400" />
      ),
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      button:
        "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
    },
  };

  const styles = variantStyles[variant];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto animate-scaleIn border border-gray-200 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icono */}
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center`}
            >
              {styles.icon}
            </div>
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 text-center mb-3">
            {title}
          </h3>

          {/* Mensaje */}
          <p className="text-gray-600 dark:text-slate-400 text-center mb-6">
            {message}
          </p>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 ${styles.button} text-white rounded-lg font-semibold transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
