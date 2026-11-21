import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLE: Record<ToastTone, string> = {
  info: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#102A43]',
  success: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16865B]',
  warning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
  error: 'border-[#FECACA] bg-[#FEF2F2] text-[#D64545]',
};

const TONE_ICON: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 top-20 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:end-6 sm:w-96"
        >
          {toasts.map((toast) => {
            const Icon = TONE_ICON[toast.tone];
            return (
              <div
                key={toast.id}
                role={toast.tone === 'error' ? 'alert' : 'status'}
                className={`pointer-events-auto flex w-full items-start justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-base font-semibold shadow-lg transition-all duration-150 ${TONE_STYLE[toast.tone]}`}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{toast.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Close"
                  className="rounded-lg p-1 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
    };
  }
  return ctx;
}
