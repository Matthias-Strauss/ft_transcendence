interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed left-1/2 top-1/2 z-[100001] w-[min(480px,92%)] -translate-x-1/2 -translate-y-1/2"
      role="dialog"
      aria-modal="true"
    >
      <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.65)]">
        {title && <div className="mb-2 text-sm font-semibold text-white">{title}</div>}
        <div className="mb-4 text-sm text-slate-400">{message}</div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="rounded-full bg-[var(--color-1)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-1)]/90"
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
