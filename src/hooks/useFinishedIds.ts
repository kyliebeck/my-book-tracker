import { useEffect, useState } from "react";
import { getFinishedIds } from "../services/readBooks";

/**
 * Which of these books you've finished, for the marker on each cover.
 *
 * One query per list rather than one per book. Returns an empty set when
 * signed out, so callers can render the markers unconditionally.
 */
export default function useFinishedIds(bookIds: string[], enabled = true) {
    const [finished, setFinished] = useState<Set<string>>(new Set());
    // Arrays are a new reference every render; key the effect on contents.
    const key = bookIds.join(",");

    useEffect(() => {
        const ids = key ? key.split(",") : [];
        if (!enabled || ids.length === 0) return;

        let ignore = false;
        getFinishedIds(ids)
            .then((result) => {
                if (!ignore) setFinished(result);
            })
            // Markers are decorative; a failure here shouldn't break the list.
            .catch((err) => console.error("Could not load finished books", err));

        return () => {
            ignore = true;
        };
    }, [key, enabled]);

    return finished;
}
