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