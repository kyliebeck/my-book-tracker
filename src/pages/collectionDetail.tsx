import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCollectionById, getBookIdsForCollection, addBookToCollection } from "../services/collections";
import { getBookById, searchBooks, coverUrl } from "../services/googleBooks";
import { useAuth } from "../hooks/useAuth";
import Cover from "../components/Cover";
import Toast, { type ToastState } from "../components/Toast";
import { BookGridSkeleton, LoadingAnnouncement } from "../components/Skeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import type { Book, Collection } from "../types";
import '../styles/collections.css';

export default function CollectionDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [toast, setToast] = useState<ToastState>(null);

    useDocumentTitle(collection?.name);

    useEffect(() => {
        if (!id) return;
        let ignore = false;
        (async () => {
            try {
                const collectionData = await getCollectionById(id);
                if (ignore) return;
                setCollection(collectionData);

                const bookIds = await getBookIdsForCollection(id);
                const results = await Promise.allSettled(bookIds.map(getBookById));
                if (ignore) return;
                setBooks(
                    results
                        .filter((r): r is PromiseFulfilledResult<Book> => r.status === "fulfilled")
                        .map((r) => r.value)
                );
                setError("");
            } catch (err) {
                if (ignore) return;
                console.error(err);
                setError("Could not load collection.");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [id]);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setSearching(true);
        setSearchError("");
        try {
            const results = await searchBooks(query);
            setSearchResults(results);
        } catch (err) {
            console.error(err);
            setSearchError("Something went wrong. Try again.");
        } finally {
            setSearching(false);
        }
    }

    async function handleAdd(bookId: string) {
        if (!id) return;
        try {
            await addBookToCollection(id, bookId);
            const added = searchResults.find((b) => b.id === bookId);
            if (added) {
                setBooks((prev) => [...prev, added]);
                setToast({ message: `Added ${added.title}.` });
            }
        } catch (err) {
            console.error(err);
            setToast({
                message: "Couldn't add — it may already be in this collection.",
                tone: "error",
            });
        }
    }

    if (loading) {
        return (
            <>
                <LoadingAnnouncement label="Loading collection" />
                <BookGridSkeleton count={8} />
            </>
        );
    }
    if (error) return <p className="error-text">{error}</p>;
    if (!collection) return <p className="empty-state">Collection not found.</p>;

    const addedIds = new Set(books.map((b) => b.id));

    return (
        <div>
            <h1>
                {collection.name}
                {collection.isPublic && <span className="collection-badge">Public</span>}
            </h1>
            <p>{collection.description}</p>
            <Link to="/collections">Back to Collections</Link>

            {books.length === 0 ? (
                <p>No books in this collection yet.</p>
            ) : (
                <ul className="book-list">
                    {books.map((book) => (
                        <li key={book.id} className="book-item">
                            <Link to={`/books/${book.id}`} className="book-link">
                                <Cover src={coverUrl(book.thumbnail)} title={book.title} />
                                <div>
                                    <h2>{book.title}</h2>
                                    <div>{book.authors.join(", ")}</div>
                                    {book.pageCount && <p>{book.pageCount} pages</p>}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {user && (
                <div className="add-book-section">
                    <h2>Add a book</h2>
                    <form className="add-book-form" onSubmit={handleSearch}>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for books..."
                        />
                        <button type="submit">Search</button>
                    </form>

                    {searching && (
                        <>
                            <LoadingAnnouncement label="Searching for books" />
                            <BookGridSkeleton count={5} />
                        </>
                    )}
                    {searchError && <p className="error-text">{searchError}</p>}

                    <ul className="book-list">
                        {searchResults.map((book) => {
                            const alreadyAdded = addedIds.has(book.id);
                            return (
                                <li key={book.id} className="book-item">
                                    <Link to={`/books/${book.id}`} className="book-link">
                                        <Cover src={coverUrl(book.thumbnail)} title={book.title} />
                                        <div>
                                            <h2>{book.title}</h2>
                                            <div>{book.authors.join(", ")}</div>

                                            {book.pageCount && <p>{book.pageCount} pages</p>}
                                        </div>
                                    </Link>

                                    {alreadyAdded ? (
                                        <span>In collection</span>
                                    ) : (
                                        <button onClick={() => handleAdd(book.id)}>
                                            Add
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}
