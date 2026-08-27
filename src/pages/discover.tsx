import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchBooks, searchByGenre, coverUrl, rankByPopularity } from "../services/googleBooks";
import Cover from "../components/Cover";
import Toast, { type ToastState } from "../components/Toast";
import { BookGridSkeleton, LoadingAnnouncement } from "../components/Skeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useScrollReveal from "../hooks/useScrollReveal";
import useFinishedIds from "../hooks/useFinishedIds";
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
    const [searchParams] = useSearchParams();
    const fromUrl = searchParams.get("q") ?? "";

    // Seeded from ?q= so the box shows what's being searched on arrival.
    const [query, setQuery] = useState(fromUrl);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(Boolean(fromUrl));
    const [error, setError] = useState("");
    const [activeGenre, setActiveGenre] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState>(null);
    /** Distinguishes "haven't searched yet" from "searched, found nothing". */
    const [searched, setSearched] = useState(Boolean(fromUrl));

    useDocumentTitle(activeGenre ? `${activeGenre} books` : "Discover");

    useScrollReveal(books);
    const { user } = useAuth();
    const finishedIds = useFinishedIds(books.map((b) => b.id), Boolean(user));

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
            setError("That search didn't work. Try again.");
        } finally {
            setLoading(false);
        }
    }

    /**
     * `/discover?q=...` runs the search on arrival. The shelf recommendations
     * link here, so a suggested title lands on results you can add straight to
     * a shelf instead of on an empty search box. `loading` and `searched` are
     * seeded from the URL above rather than set here, so the first paint
     * already shows the skeleton instead of flashing the empty state.
     */
    useEffect(() => {
        if (!fromUrl) return;
        let ignore = false;
        searchBooks(fromUrl)
            .then((results) => {
                if (!ignore) setBooks(rankByPopularity(results));
            })
            .catch((err) => {
                if (ignore) return;
                console.error(err);
                setError("That search didn't work. Try again.");
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, [fromUrl]);

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
                message: "It's already on that shelf.",
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
                        placeholder="Try &quot;Le Guin&quot; or &quot;ghost stories&quot;"
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
                    <strong>Nothing here yet</strong>
                    Pick a genre, or search for something you half-remember.
                </div>
            )}

            {!loading && searched && !error && books.length === 0 && (
                <div className="empty-state">
                    <strong>No luck</strong>
                    Try a different spelling, or something broader.
                </div>
            )}

            <ul className="book-list">
                {books.map((book) => (
                    <li key={book.id} className="book-item">
                        <Link to={`/books/${book.id}`} className="book-link">
                            <Cover
                                src={coverUrl(book.thumbnail)}
                                title={book.title}
                                finished={finishedIds.has(book.id)}
                            />
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
                                <option value="" disabled>Add to a shelf…</option>
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