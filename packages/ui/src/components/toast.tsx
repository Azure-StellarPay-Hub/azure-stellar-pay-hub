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
import { CheckCircle2, Info, XCircle } from 'lucide-react';
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
      return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'info':
      return <Info className="h-5 w-5 text-sky-400" />;
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
    success: (title: string, description?: string) => ctx.push({ kind: 'success', title, description }),
    error: (title: string, description?: string) => ctx.push({ kind: 'error', title, description }),
    info: (title: string, description?: string) => ctx.push({ kind: 'info', title, description }),
  };
}
