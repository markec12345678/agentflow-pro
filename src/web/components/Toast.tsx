"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ─── Typi ─────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICONS: Record<ToastType, string> = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

const COLORS: Record<ToastType, string> = {
  success: "bg-green-600",
  error:   "bg-red-600",
  warning: "bg-amber-500",
  info:    "bg-blue-600",
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = "info", duration = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message, duration }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const success = useCallback((msg: string) => show(msg, "success"), [show]);
  const error = useCallback((msg: string) => show(msg, "error", 5000), [show]);
  const info = useCallback((msg: string) => show(msg, "info"), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-label="Obvestila"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto animate-slide-in ${COLORS[toast.type]}`}
            style={{ animation: "slideIn 0.3s ease" }}
          >
            <span className="text-base flex-shrink-0">{ICONS[toast.type]}</span>
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity ml-2 text-lg leading-none flex-shrink-0"
              aria-label="Zapri"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
