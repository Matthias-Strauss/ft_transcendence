import '../../styles/edit-profile-modal.css';

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
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-box">
        {title && <div className="text-sm font-semibold mb-2">{title}</div>}
        <div className="text-sm text-[#8b98a5] mb-4">{message}</div>

        <div className="confirm-actions">
          <button type="button" onClick={onCancel} className="btn btn-ghost" disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="bg-[var(--color-1)] hover:bg-[var(--color-1)]/90 text-[#f7f9f9] rounded-full py-2 px-4"
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
