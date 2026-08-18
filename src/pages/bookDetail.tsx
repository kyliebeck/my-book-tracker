import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getBookById, coverUrl } from "../services/googleBooks";
import {
    getMyCollections,
    addBookToCollection,
    getShelfIdsContainingBook,
} from "../services/collections";
import { getFinishedAt, markFinished, unmarkFinished } from "../services/readBooks";
import Toast, { type ToastState } from "../components/Toast";
import type { Book, Collection } from "../types";
import { useAuth } from "../hooks/useAuth";
import Cover from "../components/Cover";
import { BookDetailSkeleton, LoadingAnnouncement } from "../components/Skeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";




export default function BookDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [shelfIds, setShelfIds] = useState<string[]>([]);
    const [finishedAt, setFinishedAt] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState>(null);

    useDocumentTitle(book?.title);

    // Which of my shelves already hold this book. Runs once collections arrive;
    // the array is a new reference each render, so key on the ids themselves.
    const myShelfKey = collections.map((c) => c.id).join(",");
    useEffect(() => {
        if (!id || !user || !myShelfKey) return;
        let ignore = false;
        getShelfIdsContainingBook(id, myShelfKey.split(","))
            .then((ids) => {
                if (!ignore) setShelfIds(ids);
            })
            .catch(console.error);
        return () => {
            ignore = true;
        };
    }, [id, user, myShelfKey]);

    // Whether this book is already marked finished. Only meaningful signed in;
    // RLS scopes the row to the current user.
    useEffect(() => {
        // No reset for the signed-out case: the toggle isn't rendered then, so
        // there's no stale state to show.
        if (!id || !user) return;
        let ignore = false;
        getFinishedAt(id)
            .then((at) => {
                if (!ignore) setFinishedAt(at);
            })
            .catch(console.error);
        return () => {
            ignore = true;
        };
    }, [id, user]);

    async function toggleFinished(next: boolean) {
        if (!id) return;
        const previous = finishedAt;
        // Optimistic: the checkbox should respond instantly.
        setFinishedAt(next ? new Date().toISOString() : null);
        try {
            if (next) await markFinished(id);
            else await unmarkFinished(id);
        } catch (err) {
            console.error(err);
            setFinishedAt(previous);
            setToast({ message: "Couldn't save that. Try again.", tone: "error" });
        }
    }


    function renderStars(rating: number) {
        return [1, 2, 3, 4, 5].map((n) => {
            if (rating >= n) return <span key={n}>★</span>;   // full
            if (rating >= n - 0.5) return <span key={n}>½</span>;   // half
            return <span key={n}>☆</span>;                    // empty
        });
    }

    async function handleAddToCollection() {
        if (!selectedId || !id) return;          // nothing chosen → bail
        try {
            await addBookToCollection(selectedId, id);   // collection first, book second
            // Swaps the picker for the "In … shelf" line, which is the feedback.
            setShelfIds((prev) =>
                prev.includes(selectedId) ? prev : [...prev, selectedId]
            );
            setSelectedId("");
        } catch (err) {
            console.error(err);
            setToast({ message: "It's already on that shelf.", tone: "error" });
        }
    }




    useEffect(() => {
        if (!id) return;
        let ignore = false;
        (async () => {
            try {
                const bookData = await getBookById(id);
                if (ignore) return;
                setBook(bookData);
                setError(null);
            } catch (err) {
                if (ignore) return;
                console.error(err);
                setError("Couldn't load that book.");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [id]);

    useEffect(() => {
        if (!user) return;
        let ignore = false;
        getMyCollections()
            .then((data) => {
                if (!ignore) setCollections(data);
            })
            .catch((err) => {
                if (!ignore) console.error(err);
            })
        return () => { ignore = true; }
    }, [user]);


    if (loading) {
        return (
            <>
                <LoadingAnnouncement label="Loading book" />
                <BookDetailSkeleton />
            </>
        );
    }
    if (error) return <p className="error-text">{error}</p>;
    if (!book) return <p className="empty-state">Can't find that book.</p>;

    const cover = coverUrl(book.thumbnail, 3);
    const shelvesWithBook = collections.filter((c) => shelfIds.includes(c.id));

    // Only render rows Google actually returned data for — empty "Publisher: "
    // rows were the main thing making this page look like a debug dump.
    const meta: [string, React.ReactNode][] = [
        ["Genres", book.categories?.join(", ")],
        ["Publisher", book.publisher],
        ["Published", book.publishedDate],
        ["Pages", book.pageCount],
        ["ISBN", book.isbn],
        ["Language", book.language?.toUpperCase()],
        ["Format", book.printType],
    ].filter(([, value]) => value != null && value !== "") as [string, React.ReactNode][];

    return (
        <div className="book-detail-container">
            {cover && (
                <div className="detail-backdrop" aria-hidden="true">
                    <img src={cover} alt="" />
                </div>
            )}

            <h1>{book.title}</h1>

            <div className="book-cover">
                <Cover src={cover} title={book.title} eager />
            </div>

            <div className="book-detail">
                {book.authors?.length > 0 && (
                    <p className="detail-byline">{book.authors.join(", ")}</p>
                )}

                {book.averageRating != null && (
                    <div className="detail-rating">
                        <span className="detail-stars">{renderStars(book.averageRating)}</span>
                        <span>
                            {book.averageRating.toFixed(1)}
                            {book.ratingsCount != null && ` · ${book.ratingsCount} ratings`}
                        </span>
                    </div>
                )}

                {/* Only for books on one of your own shelves. Reaching this page
                    from someone else's public shelf shouldn't offer to log it as
                    read — that's a control over your library, and this book isn't
                    in it yet. Deliberately based on shelf membership rather than
                    which page you came from, so it survives a refresh or a
                    pasted link. */}
                {user && shelvesWithBook.length > 0 && (
                    <label className={`finished-toggle${finishedAt ? " is-finished" : ""}`}>
                        <input
                            type="checkbox"
                            checked={Boolean(finishedAt)}
                            onChange={(e) => toggleFinished(e.target.checked)}
                        />
                        <span className="finished-label">
                            {finishedAt ? "Finished" : "Mark as finished"}
                        </span>
                        {finishedAt && (
                            <span className="finished-date">
                                {new Date(finishedAt).toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        )}
                    </label>
                )}

                {user && shelvesWithBook.length > 0 && (
                    <p className="in-shelf">
                        In{" "}
                        {shelvesWithBook.map((shelf, i) => (
                            <span key={shelf.id}>
                                {i > 0 &&
                                    (i === shelvesWithBook.length - 1 ? " and " : ", ")}
                                <Link to={`/collections/${shelf.id}`}>{shelf.name}</Link>
                            </span>
                        ))}{" "}
                        {shelvesWithBook.length === 1 ? "shelf" : "shelves"}
                    </p>
                )}

                {user && shelvesWithBook.length === 0 && collections.length > 0 && (
                    <div className="add-to-collection">
                        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                            <option value="">Choose a shelf…</option>
                            {collections.map((col) => (
                                <option key={col.id} value={col.id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddToCollection} disabled={!selectedId}>
                            Add to shelf
                        </button>
                    </div>
                )}

                {book.description && (
                    <div
                        className="book-description"
                        dangerouslySetInnerHTML={{ __html: book.description }}
                    />
                )}

                {meta.length > 0 && (
                    <dl className="detail-meta">
                        {meta.map(([label, value]) => (
                            <div key={label}>
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>

            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    )
}