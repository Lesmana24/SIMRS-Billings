import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in print:static print:p-0 print:bg-white print:backdrop-blur-none"
      onClick={onClose}
    >
      <div 
        className={`glass-modal w-full ${maxWidth} max-h-[85vh] p-6 relative flex flex-col border border-white/20 shadow-2xl overflow-hidden my-auto print:max-h-none print:h-auto print:overflow-visible print:p-0 print:border-none print:shadow-none print:bg-white`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0 no-print">
          <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup Dialog"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto pr-1.5 flex-1 min-h-0 print:overflow-visible print:h-auto print:max-h-none">{children}</div>
      </div>
    </div>,
    document.body
  );
};
