"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 lg:bottom-6 right-4 z-[90] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none print:hidden"
    >
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        const isInfo = toast.type === "info";
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-md text-xs font-semibold animate-in fade-in zoom-in-95 ${
              isError
                ? "bg-white border-terracotta/40 text-terracotta"
                : isInfo
                ? "bg-white border-line text-ink"
                : "bg-white border-euskara/40 text-ink"
            }`}
          >
            {isError ? (
              <AlertCircle className="w-4 h-4 text-terracotta shrink-0" />
            ) : isInfo ? (
              <Info className="w-4 h-4 text-sea shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-euskara shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Itxi jakinarazpena"
              className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-sand transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
