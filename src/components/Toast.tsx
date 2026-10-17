import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-800/95 backdrop-blur text-white border border-amber-500/40 shadow-2xl shadow-black/40"
          role="status"
        >
          <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-medium text-slate-100">{message}</span>
          <button
            onClick={onClose}
            className="ml-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
