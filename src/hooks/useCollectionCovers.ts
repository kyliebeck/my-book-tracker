import { useEffect, useState } from "react";
import { getPreviewBookIds } from "../services/collections";
import { getBooksByIds, coverUrl } from "../services/googleBooks";

/**
 * Cover art for the stack on each collection card, keyed by collection id.
 *
 * Cost is one Supabase query for all collections on the page, plus one Google
 * Books request per *unique* book id across them (capped at 3 per collection
 * and cached in the service). Loading is deliberately silent — the cards are
 * fully readable without art, so covers fade in when they arrive rather than
 * blocking the page or showing another skeleton.
 */
export default function useCollectionCovers(collectionIds: string[]) {
    const [covers, setCovers] = useState<Record<string, string[]>>({});
    // Arrays are a fresh reference each render; key the effect on contents.
    const key = collectionIds.join(",");

    useEffect(() => {
        const ids = key ? key.split(",") : [];
        if (ids.length === 0) return;

        let ignore = false;
        (async () => {
            try {
                const previews = await getPreviewBookIds(ids);
                const unique = [...new Set(Object.values(previews).flat())];
                if (unique.length === 0) return;

                const books = await getBooksByIds(unique);
                if (ignore) return;

                const next: Record<string, string[]> = {};
                for (const [collectionId, bookIds] of Object.entries(previews)) {
                    next[collectionId] = bookIds
                        .map((id) => coverUrl(books.get(id)?.thumbnail))
                        .filter((url): url is string => Boolean(url));
                }
                setCovers(next);
            } catch (err) {
                // Card art is decorative; failing to load it must not break the page.
                console.error("Could not load collection cover art", err);
            }
        })();

        return () => {
            ignore = true;
        };
    }, [key]);

    return covers;
}
