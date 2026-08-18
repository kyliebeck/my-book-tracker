import { useEffect } from "react";

const SUFFIX = "Nightstand";

/**
 * Sets the browser tab title per page, e.g. "Discover · Nightstand". Without
 * this every route reads the same thing, making open tabs indistinguishable.
 *
 * Pass undefined while data is still loading to leave the title alone rather
 * than flashing "undefined".
 */
export default function useDocumentTitle(title?: string) {
    useEffect(() => {
        if (!title) return;
        const previous = document.title;
        document.title = `${title} · ${SUFFIX}`;
        return () => {
            document.title = previous;
        };
    }, [title]);
}
