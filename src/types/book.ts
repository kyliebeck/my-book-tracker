export interface Book {
    id: string;            // Google Books volume id
    title: string;
    authors: string[];     // a book can have multiple authors
    description?: string;  // "?" means optional — may be missing
    thumbnail?: string;    // cover image URL
    categories?: string[];
    publishedDate?: string;
    pageCount?: number;
    publisher?: string;
    subtitle?: string;
    isbn?: string;         // ISBN-10 or ISBN-13
    language?: string;      // e.g., "en", "fr", "es"
    printType?: string;      // e.g., "BOOK", "MAGAZINE"
    averageRating?: number; // average rating from Google Books
    ratingsCount?: number;  // number of ratings from Google Books

}