import { useState } from "react";
import { Link } from "react-router-dom";
import { searchBooks, searchByGenre, coverUrl, rankByPopularity } from "../services/googleBooks";
import Cover from "../components/Cover";
import Toast, { type ToastState } from "../components/Toast";
import { BookGridSkeleton, LoadingAnnouncement } from "../components/Skeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useScrollReveal from "../hooks/useScrollReveal";
import type { Book } from "../types";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getMyCollections, addBookToCollection } from "../services/collections";
type CollectionRow = { id: string; name: string };

const GENRES = [
    "Fiction",
    "Mystery",
    "Romance",
    "Science Fiction",
    "Fantasy",
    "Biography",
    "History",
    "Self-Help",
    "Young Adult",
    "Horror",
];

export default function Discover() {
    const [query, setQuery] = useState("");
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeGenre, setActiveGenre] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState>(null);
    /** Distinguishes "haven't searched yet" from "searched, found nothing". */
    const [searched, setSearched] = useState(false);

    useDocumentTitle(activeGenre ? `${activeGenre} books` : "Discover");

    useScrollReveal(books);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setActiveGenre(null);
        setLoading(true);
        setSearched(true);
        setError("");
        try {
            const results = await searchBooks(query);
            setBooks(rankByPopularity(results));
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleGenreClick(genre: string) {
        setQuery("");
        setActiveGenre(genre);
        setLoading(true);
        setSearched(true);
        setError("");
        try {
            const results = await searchByGenre(genre);
            setBooks(rankByPopularity(results));
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    }

    const { user } = useAuth();
    const [collections, setCollections] = useState<CollectionRow[]>([]);

    useEffect(() => {
        if (user) getMyCollections().then(setCollections).catch(console.error);
    }, [user]);

    async function handleAdd(collectionId: string, bookId: string) {
        const name = collections.find((c) => c.id === collectionId)?.name;
        try {
            await addBookToCollection(collectionId, bookId);
            setToast({ message: name ? `Added to ${name}.` : "Added to collection." });
        } catch (err) {
            console.error(err);
            setToast({
                message: "Couldn't add — it may already be in that collection.",
                tone: "error",
            });
        }
    }

    return (
        <div>
            <p className="eyebrow">Browse</p>
            <h1>Discover</h1>

            <div className="toolbar">
                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by title, author, subject…"
                    />
                    <button type="submit">Search</button>
                </form>

                <div className="genre-row">
                    {GENRES.map((genre) => (
                        <button
                            key={genre}
                            type="button"
                            className={`genre-btn${activeGenre === genre ? " active" : ""}`}
                            onClick={() => handleGenreClick(genre)}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <>
                    <LoadingAnnouncement label="Searching for books" />
                    <BookGridSkeleton />
                </>
            )}
            {error && <p className="error-text">{error}</p>}

            {!loading && !searched && (
                <div className="empty-state">
                    <strong>Find your next read</strong>
                    Search by title, author or subject — or pick a genre above to see
                    what's popular.
                </div>
            )}

            {!loading && searched && !error && books.length === 0 && (
                <div className="empty-state">
                    <strong>Nothing found</strong>
                    Try a different spelling, a broader term, or one of the genres above.
                </div>
            )}

            <ul className="book-list">
                {books.map((book) => (
                    <li key={book.id} className="book-item">
                        <Link to={`/books/${book.id}`} className="book-link">
                            <Cover src={coverUrl(book.thumbnail)} title={book.title} />
                            <div>
                                <strong>{book.title}</strong>
                                <div>{book.authors.join(", ")}</div>
                            </div>
                        </Link>
                        {user && collections.length > 0 && (
                            <select
                                defaultValue=""
                                onChange={(e) => {
                                    if (e.target.value) handleAdd(e.target.value, book.id);
                                    e.target.value = "";
                                }}
                            >
                                <option value="" disabled>Add to collection…</option>
                                {collections.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                    </li>
                ))}
            </ul>

            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}