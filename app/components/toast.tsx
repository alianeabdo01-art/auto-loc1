"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error";

type ToastState = {
  message: string;
  variant: ToastVariant;
} | null;

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const [visible, setVisible] = useState(false);

  const showToast = (message: string, variant: ToastVariant = "success") => {
    setToast({ message, variant });
    setVisible(false);
  };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const enterTimeout = window.setTimeout(() => {
      setVisible(true);
    }, 10);

    const exitTimeout = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => setToast(null), 200);
    }, 3000);

    return () => {
      window.clearTimeout(enterTimeout);
      window.clearTimeout(exitTimeout);
    };
  }, [toast]);

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-5 py-3 text-sm font-medium backdrop-blur-xl shadow-2xl transition-all duration-200 ${
            toast.variant === "success"
              ? "border-[#22c55e33] bg-[#22c55e15] text-[#22c55e]"
              : "border-[#ef444433] bg-[#ef444415] text-[#ef4444]"
          } ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
        >
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}