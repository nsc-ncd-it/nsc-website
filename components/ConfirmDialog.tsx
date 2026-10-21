'use client';

import { useEffect } from 'react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  // Pressing Esc closes the dialog
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-[1.75rem] border bg-slate-950 p-8 text-center shadow-2xl ${
          danger ? 'border-red-500/30' : 'border-sky-500/30'
        }`}
      >
        <div
          className={`mx-auto mb-5 w-14 h-14 rounded-full flex items-center justify-center ${
            danger ? 'bg-red-500/15 text-red-400' : 'bg-sky-500/15 text-sky-400'
          }`}
        >
          {danger ? (
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          ) : (
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-black mb-2 text-white">{title}</h2>

        <p className="text-slate-400 leading-relaxed mb-8">{message}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-6 py-3 border border-slate-700 hover:border-slate-500 disabled:opacity-50 transition-all rounded-xl text-slate-300 font-bold text-sm"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={busy}
            className={`px-6 py-3 disabled:opacity-60 transition-all rounded-xl font-black text-sm ${
              danger
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
            }`}
          >
            {busy ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
