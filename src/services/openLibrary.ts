/**
 * Open Library, used purely as a popularity source.
 *
 * Google Books has no popularity ordering at all — `orderBy` accepts only
 * `relevance` and `newest`, and its `ratingsCount` is far too sparse to stand
 * in for one (The Hobbit reports 12 ratings). Open Library exposes
 * `readinglog_count`, the number of users who have the book on a shelf, which
 * is a real signal: Harry Potter ~23k, A Game of Thrones ~13k.
 *
 * These are Open Library editions, not Google volumes, so they have no Google
 * volume id and can't link to /books/:id. Only use them somewhere decorative.
 */

const SEARCH_URL = "https://openlibrary.org/search.json";
const FIELDS = "key,title,author_name,cover_i,readinglog_count";

export interface PopularBook {
    key: string;
    title: string;
    authors: string[];
    coverUrl: string;
    readers: number;
}

interface OpenLibraryDoc {
    key?: string;
    title?: string;
    author_name?: string[];
    cover_i?: number;
    readinglog_count?: number;
}

/**
 * Most-shelved books for a subject, most popular first.
 *
 * `-M` is 180px wide — about 1.5x the 116px shelf tile, so it stays sharp
 * without the ~2x file size of `-L` across 40 images.
 */
export async function getPopularBySubject(
    subject: string,
    limit = 20
): Promise<PopularBook[]> {
    const params = new URLSearchParams({
        q: `subject:${subject.toLowerCase().replace(/\s+/g, "_")}`,
        sort: "readinglog",
        limit: String(limit),
        fields: FIELDS,
    });

    const res = await fetch(`${SEARCH_URL}?${params}`);
    if (!res.ok) throw new Error(`Open Library error: ${res.status}`);

    const data: { docs?: OpenLibraryDoc[] } = await res.json();
    return (data.docs ?? [])
        // No cover_i means no artwork at all, which is useless on a shelf.
        .filter((doc) => doc.cover_i != null)
        .map((doc) => ({
            key: doc.key ?? "",
            title: doc.title ?? "Untitled",
            authors: doc.author_name ?? [],
            coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
            readers: doc.readinglog_count ?? 0,
        }));
}
