import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
    getCollectionById,
    getBookIdsForCollection,
    addBookToCollection,
    removeBookFromCollection,
    deleteCollection,
} from "../services/collections";
import ConfirmDialog from "../components/ConfirmDialog";
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
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    useDocumentTitle(collection?.name);

    /**
     * Community links to other people's public collections, so a signed-in
     * visitor can land here without owning the shelf. Editing controls are
     * gated on ownership — RLS should refuse anyway, but the UI shouldn't
     * offer an action that's going to be rejected.
     */
    const isOwner = Boolean(user && collection && user.id === collection.ownerId);

    async function handleRemoveBook(book: Book) {
        if (!id) return;
        // Optimistic: drop it from the list immediately, restore if the call fails.
        setBooks((prev) => prev.filter((b) => b.id !== book.id));
        try {
            await removeBookFromCollection(id, book.id);
            setToast({
                message: `Removed ${book.title}.`,
                action: {
                    label: "Undo",
                    onAction: async () => {
                        try {
                            await addBookToCollection(id, book.id);
                            setBooks((prev) =>
                                prev.some((b) => b.id === book.id) ? prev : [...prev, book]
                            );
                        } catch (err) {
                            console.error(err);
                            setToast({ message: "Couldn't undo that.", tone: "error" });
                        }
                    },
                },
            });
        } catch (err) {
            console.error(err);
            setBooks((prev) =>
                prev.some((b) => b.id === book.id) ? prev : [...prev, book]
            );
            setToast({ message: "Couldn't remove it.", tone: "error" });
        }
    }

    async function handleDeleteCollection() {
        if (!id) return;
        setDeleting(true);
        try {
            await deleteCollection(id);
            navigate("/collections", {
                replace: true,
                state: { deleted: collection?.name },
            });
        } catch (err) {
            console.error(err);
            setDeleting(false);
            setConfirmingDelete(false);
            setToast({ message: "Couldn't delete that shelf.", tone: "error" });
        }
    }

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
                setError("Couldn't load that shelf.");
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
            setSearchError("That search didn't work. Try again.");
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
                message: "It's already on this shelf.",
                tone: "error",
            });
        }
    }

    if (loading) {
        return (
            <>
                <LoadingAnnouncement label="Loading shelf" />
                <BookGridSkeleton count={8} />
            </>
        );
    }
    if (error) return <p className="error-text">{error}</p>;
    if (!collection) return <p className="empty-state">Can't find that shelf.</p>;

    const addedIds = new Set(books.map((b) => b.id));

    return (
        <div>
            <Link className="back-link" to="/collections">
                ← All shelves
            </Link>

            <h1>
                {collection.name}
                {collection.isPublic && <span className="collection-badge">Public</span>}
            </h1>
            {collection.description && <p>{collection.description}</p>}

            <div className="detail-toolbar">
                <span className="detail-count">
                    {books.length} {books.length === 1 ? "book" : "books"}
                </span>
                {isOwner && (
                    <button
                        type="button"
                        className="btn-danger-quiet"
                        onClick={() => setConfirmingDelete(true)}
                    >
                        Delete shelf
                    </button>
                )}
            </div>

            {books.length === 0 ? (
                <div className="empty-state">
                    <strong>Empty shelf</strong>
                    {isOwner
                        ? "Add something below."
                        : "Nothing here yet."}
                </div>
            ) : (
                <ul className="book-list">
                    {books.map((book) => (
                        <li
                            key={book.id}
                            className={`book-item${isOwner ? " book-item-removable" : ""}`}
                        >
                            {isOwner && (
                                <button
                                    type="button"
                                    className="book-remove"
                                    aria-label={`Remove ${book.title} from this shelf`}
                                    onClick={() => handleRemoveBook(book)}
                                >
                                    ×
                                </button>
                            )}
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

            {isOwner && (
                <div className="add-book-section">
                    <h2>Add a book</h2>
                    <form className="add-book-form" onSubmit={handleSearch}>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Title or author"
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
                                        <span>On the shelf</span>
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

            <ConfirmDialog
                open={confirmingDelete}
                title="Delete this shelf?"
                body={`"${collection.name}" and its ${books.length} ${books.length === 1 ? "book" : "books"} will be removed. This can't be undone.`}
                confirmLabel="Delete shelf"
                busy={deleting}
                onConfirm={handleDeleteCollection}
                onCancel={() => !deleting && setConfirmingDelete(false)}
            />

            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}
