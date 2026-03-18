import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

export interface Toast {
  id: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timeout = toastTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(id);
    }
  }, []);

  const addToast = useCallback((message: string, duration = 2000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast: Toast = { id, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    const timeout = setTimeout(() => {
      removeToast(id);
    }, duration);

    toastTimeouts.current.set(id, timeout);
  }, [removeToast]);

  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
