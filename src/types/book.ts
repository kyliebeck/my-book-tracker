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

}