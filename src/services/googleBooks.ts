import type { Book } from "../types";

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const KEY = import.meta.env.VITE_GOOGLE_BOOKS_KEY;


interface GoogleVolume {
    id: string;
    volumeInfo?: {
        title?: string;
        authors?: string[];
        description?: string;
        imageLinks?: { thumbnail?: string };
        categories?: string[];
        publishedDate?: string;
        pageCount?: number;
        publisher?: string;
        subtitle?: string;
        language?: string;
        printType?: string;
        averageRating?: number;
        ratingsCount?: number;
        industryIdentifiers?: { type: string; identifier: string }[];
    };
}
// Google's response is deeply nested; this maps one "volume" to our Book.
function mapVolumeToBook(volume: GoogleVolume): Book {
    const info = volume.volumeInfo ?? {};
    return {
        id: volume.id,
        title: info.title ?? "Untitled",
        authors: info.authors ?? [],
        description: info.description,
        thumbnail: info.imageLinks?.thumbnail,
        categories: info.categories,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        publisher: info.publisher,
        subtitle: info.subtitle,
        language: info.language,
        printType: info.printType,
        averageRating: info.averageRating,
        ratingsCount: info.ratingsCount,

        isbn: info.industryIdentifiers?.find((id) => id.type === "ISBN_13")?.identifier
            ?? info.industryIdentifiers?.find((id) => id.type === "ISBN_10")?.identifier,
    };
}

/**
 * Google hands back a ~128px `zoom=1` thumbnail over plain http. That's too
 * small and too insecure to render directly — upscaling it to grid size looks
 * blurry. `zoom=2` returns the same image at 300px wide (same aspect ratio,
 * not a crop), and `edge=curl` bakes a fake page-curl into the corner that
 * fights a flat cover treatment, so drop it.
 *
 * Note this can still return a URL that is not a cover at all — see
 * components/Cover.tsx for the shape guard that catches those.
 */
export function coverUrl(thumbnail?: string, zoom = 2): string | undefined {
    if (!thumbnail) return undefined;
    return thumbnail
        .replace("http://", "https://")
        .replace(/zoom=\d+/, `zoom=${zoom}`)
        .replace("&edge=curl", "");
}

/**
 * Approximate "popular first" for Google Books results.
 *
 * The API has no popularity ordering (`orderBy` takes only `relevance` and
 * `newest`), and `ratingsCount` is present on well under half of results and
 * tiny where it exists — sorting on it alone ranks Graceling (114 ratings)
 * above The Hobbit (12). So this scores metadata completeness instead: a
 * mainstream commercial edition reliably carries a cover, a description, a
 * publisher and an ISBN, while the obscure scans that clutter subject queries
 * carry almost none. Ratings still count, log-scaled, as a tiebreaker.
 *
 * This is a proxy for "mainstream", not true popularity — see
 * services/openLibrary.ts for real readership numbers.
 */
export function scorePopularity(book: Book): number {
    let score = 0;
    if (book.thumbnail) score += 4;
    if (book.description) score += 2;
    if (book.publisher) score += 1;
    if (book.isbn) score += 1;
    if (book.pageCount) score += 0.5;
    if (book.categories?.length) score += 0.5;
    if (book.ratingsCount) score += Math.log10(1 + book.ratingsCount) * 2;
    if (book.averageRating) score += book.averageRating * 0.5;
    return score;
}

/** Most mainstream-looking first. Stable, so equal scores keep Google's order. */
export function rankByPopularity(books: Book[]): Book[] {
    return books
        .map((book, index) => ({ book, index, score: scorePopularity(book) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((entry) => entry.book);
}

export async function searchBooks(query: string): Promise<Book[]> {
    if (!query.trim()) return [];
    const url = `${BASE_URL}?q=${encodeURIComponent(query)}&key=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Books error: ${res.status}`);
    const data: { items?: GoogleVolume[] } = await res.json();
    return (data.items ?? []).map(mapVolumeToBook);
}

export async function searchByGenre(genre: string): Promise<Book[]> {
    const url = `${BASE_URL}?q=${encodeURIComponent(`subject:"${genre}"`)}&orderBy=relevance&maxResults=20&key=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Books error: ${res.status}`);
    const data: { items?: GoogleVolume[] } = await res.json();
    return (data.items ?? []).map(mapVolumeToBook);
}

export async function getBookById(id: string): Promise<Book> {
    const url = `${BASE_URL}/${id}?key=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Books error: ${res.status}`);
    const data: GoogleVolume = await res.json();
    return mapVolumeToBook(data);
}