import { useEffect } from "react";

/**
 * Replaces the native alert() calls. Deliberately local state rather than a
 * global provider — only a few pages raise toasts, so a context + reducer
 * would be more machinery than the problem needs.
 */

export type ToastState = {
    message: string;
    tone?: "info" | "error";
    /** Optional inline action, used for undoing a removal. */
    action?: { label: string; onAction: () => void };
} | null;

type Props = {
    toast: ToastState;
    onDismiss: () => void;
    /** Auto-dismiss delay in ms. */
    duration?: number;
};

export default function Toast({ toast, onDismiss, duration = 4000 }: Props) {
    const message = toast?.message;
    // An undoable toast sticks around longer — 4s isn't enough to notice a
    // mistake, read the message, and reach for Undo.
    const life = toast?.action ? Math.max(duration, 8000) : duration;

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(onDismiss, life);
        return () => clearTimeout(timer);
        // Keyed on message so a repeat toast restarts the timer.
    }, [message, life, onDismiss]);

    if (!toast) return null;

    return (
        <div className="toast-stack">
            <div
                className={`toast${toast.tone === "error" ? " error" : ""}`}
                role="status"
                aria-live="polite"
            >
                <span>{toast.message}</span>

                {toast.action && (
                    <button
                        type="button"
                        className="toast-action"
                        onClick={() => {
                            toast.action?.onAction();
                            onDismiss();
                        }}
                    >
                        {toast.action.label}
                    </button>
                )}

                <button
                    type="button"
                    className="toast-dismiss"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
