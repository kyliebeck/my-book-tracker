import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getBookById, coverUrl } from "../services/googleBooks";
import { getMyCollections, addBookToCollection } from "../services/collections";
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
    const [addStatus, setAddStatus] = useState<string>("");

    useDocumentTitle(book?.title);


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
            setAddStatus("Added ✓");
        } catch (err) {
            console.error(err);
            setAddStatus("Could not add — maybe it's already there.");
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
                setError("Could not load book.");
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
    if (!book) return <p className="empty-state">Book not found.</p>;

    const cover = coverUrl(book.thumbnail, 3);

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

                {user && (
                    <div className="add-to-collection">
                        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                            <option value="">Choose a collection…</option>
                            {collections.map((col) => (
                                <option key={col.id} value={col.id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddToCollection} disabled={!selectedId}>
                            Add to collection
                        </button>
                        {addStatus && <p>{addStatus}</p>}
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
        </div>
    )
}