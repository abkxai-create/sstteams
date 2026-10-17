import React from 'react';
import { CheckCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-800 text-white border border-amber-500/50 shadow-2xl animate-bounce-short">
      <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="text-xs font-medium text-slate-100">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-white text-xs font-bold"
      >
        ✕
      </button>
    </div>
  );
};
