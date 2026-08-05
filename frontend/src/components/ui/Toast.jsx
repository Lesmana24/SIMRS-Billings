import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';

  return createPortal(
    <div className={`fixed bottom-6 right-6 z-[10000] flex items-center gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-fade-in ${
      isSuccess
        ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
        : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
    }`}>
      {isSuccess ? <CheckCircle2 className="text-emerald-400 shrink-0" size={20} /> : <AlertCircle className="text-rose-400 shrink-0" size={20} />}
      <p className="text-sm font-medium pr-2">{message}</p>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
          <X size={16} />
        </button>
      )}
    </div>,
    document.body
  );
};
