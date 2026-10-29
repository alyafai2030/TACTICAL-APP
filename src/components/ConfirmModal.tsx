import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  extraOptionLabel?: string;
  extraOptionChecked?: boolean;
  onExtraOptionChange?: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  isDanger = true,
  extraOptionLabel,
  extraOptionChecked,
  onExtraOptionChange,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden relative"
        dir="rtl"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className={`p-2.5 rounded-xl shrink-0 ${isDanger ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="pt-0.5">
            <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
            <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        {extraOptionLabel && onExtraOptionChange && (
          <label className="flex items-center gap-3 p-3 my-4 bg-slate-800/80 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={extraOptionChecked}
              onChange={(e) => onExtraOptionChange(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-600 focus:ring-rose-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-200 select-none font-medium">{extraOptionLabel}</span>
          </label>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition-colors min-h-[44px]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-md min-h-[44px] ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 active:scale-[0.98]'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40 active:scale-[0.98]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
