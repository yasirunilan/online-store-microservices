'use client';

import { cn } from '@/lib/cn';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextValue {
  toast: (message: string, variant?: 'default' | 'destructive') => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: 'default' | 'destructive' = 'default') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-md px-4 py-3 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2',
              t.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary text-primary-foreground',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
