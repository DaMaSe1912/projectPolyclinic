import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${widthClasses[maxWidth]} bg-white rounded-2xl sm:rounded-[24px] shadow-[0_20px_50px_rgba(15,23,42,0.15)] overflow-hidden border border-slate-200/80 transform transition-all`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 sm:px-7 py-4 sm:py-5 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <h3 className="font-headline font-semibold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
