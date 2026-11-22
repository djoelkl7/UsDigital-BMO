import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={18} className="text-[#16865B] shrink-0" />,
    error: <XCircle size={18} className="text-[#D93025] shrink-0" />,
    info: <Info size={18} className="text-[#4A90C6] shrink-0" />,
    warning: <AlertTriangle size={18} className="text-[#D99A20] shrink-0" />
  };

  const styles = {
    success: 'bg-white border-emerald-200 text-[#263746]',
    error: 'bg-white border-red-200 text-[#263746]',
    info: 'bg-white border-[#DCEAF5] text-[#263746]',
    warning: 'bg-white border-amber-200 text-[#263746]'
  };

  return (
    <div
      className={`fixed top-5 right-5 ${styles[type]} border px-4 py-3.5 rounded-xl shadow-lg flex items-center gap-3 z-[80] max-w-sm animate-scale-in`}
      role="status"
      aria-live="polite"
    >
      {icons[type]}
      <span className="text-sm font-medium leading-snug">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-1 p-1 rounded-lg text-[#68798A] hover:text-[#263746] hover:bg-[#F3F7FB] transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = React.useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  const ToastContainer = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastContainer };
};
