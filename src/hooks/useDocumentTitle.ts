import { useEffect } from "react";

const SUFFIX = "Book Tracker";

/**
 * Sets the browser tab title per page. Without this every route reads
 * "my-book-tracker", which makes multiple open tabs indistinguishable.
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
