import { useEffect } from "react";

/**
 * Replaces the native alert() calls. Deliberately local state rather than a
 * global provider — only two pages raise toasts, so a context + reducer would
 * be more machinery than the problem needs.
 */

export type ToastState = { message: string; tone?: "info" | "error" } | null;

type Props = {
    toast: ToastState;
    onDismiss: () => void;
    /** Auto-dismiss delay in ms. */
    duration?: number;
};

export default function Toast({ toast, onDismiss, duration = 4000 }: Props) {
    const message = toast?.message;

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
        // Keyed on message so a repeat toast restarts the timer.
    }, [message, duration, onDismiss]);

    if (!toast) return null;

    return (
        <div className="toast-stack">
            <div
                className={`toast${toast.tone === "error" ? " error" : ""}`}
                role="status"
                aria-live="polite"
            >
                <span>{toast.message}</span>
                <button
                    type="button"
                    className="toast-dismiss"
                    onClick={onDismiss}
                    aria-label="Dismiss notification"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
