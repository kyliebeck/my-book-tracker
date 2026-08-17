import { useEffect, useRef } from "react";

/**
 * Confirmation for irreversible actions. Replaces window.confirm(), which is
 * unstyled and blocks the whole tab.
 *
 * Uses <dialog showModal()> so the browser handles the focus trap, inertness of
 * the page behind, and Escape-to-close for us rather than reimplementing them.
 */

type Props = {
    open: boolean;
    title: string;
    body?: string;
    confirmLabel?: string;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmDialog({
    open,
    title,
    body,
    confirmLabel = "Delete",
    busy = false,
    onConfirm,
    onCancel,
}: Props) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            className="confirm"
            // Fires on Escape as well as close(), so cancelling stays in sync.
            onClose={onCancel}
            onCancel={(e) => {
                e.preventDefault();
                onCancel();
            }}
        >
            <h2 className="confirm-title">{title}</h2>
            {body && <p className="confirm-body">{body}</p>}
            <div className="confirm-actions">
                <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn-danger"
                    onClick={onConfirm}
                    disabled={busy}
                >
                    {busy ? "Deleting…" : confirmLabel}
                </button>
            </div>
        </dialog>
    );
}
