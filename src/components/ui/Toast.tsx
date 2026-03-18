'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../hooks/useToast';

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto"
          >
            <div className="bg-zinc-900 text-white px-4 py-3 text-xs font-mono uppercase tracking-widest shadow-xl flex items-center gap-3 min-w-[200px]">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-white transition-colors ml-2"
                aria-label="Dismiss"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
