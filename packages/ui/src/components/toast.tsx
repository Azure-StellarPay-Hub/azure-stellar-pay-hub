'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type Context,
  type ReactNode,
} from 'react';
import { cn } from '../lib/utils';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

let _ToastContext: Context<{ push: (t: Omit<ToastItem, 'id'>) => void } | null> | null = null;
function getToastContext() {
  if (!_ToastContext) {
    _ToastContext = createContext<{ push: (t: Omit<ToastItem, 'id'>) => void } | null>(null);
  }
  return _ToastContext;
}

function ToastIcon({ kind }: { kind: ToastKind }) {
  switch (kind) {
    case 'success':
      return (
        <svg
          className="h-5 w-5 text-emerald-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'error':
      return (
        <svg
          className="h-5 w-5 text-destructive"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'info':
      return (
        <svg
          className="h-5 w-5 text-sky-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const TContext = getToastContext();
  return (
    <TContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            onClick={() => remove(toast.id)}
            className={cn(
              'pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-border bg-background/95 p-4 text-left shadow-xl backdrop-blur',
              'animate-in slide-in-from-bottom-2 fade-in-0',
            )}
          >
            <ToastIcon kind={toast.kind} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </TContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(getToastContext());
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return {
    success: (title: string, description?: string) =>
      ctx.push({ kind: 'success', title, description }),
    error: (title: string, description?: string) => ctx.push({ kind: 'error', title, description }),
    info: (title: string, description?: string) => ctx.push({ kind: 'info', title, description }),
  };
}
