import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  const { type = 'success', message } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white border-emerald-200 shadow-emerald-900/5 text-slate-800',
    error: 'bg-white border-rose-200 shadow-rose-900/5 text-slate-800',
    info: 'bg-white border-sky-200 shadow-sky-900/5 text-slate-800',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-bounce-in">
      <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-xl ${bgStyles[type]}`}>
        {icons[type]}
        <div className="flex-1 text-sm font-medium">{message}</div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
