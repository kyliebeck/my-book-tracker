import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getBookById } from "../services/googleBooks";
import { getMyCollections, addBookToCollection } from "../services/collections";
import type { Book, Collection } from "../types";
import { useAuth } from "../hooks/useAuth";




export default function BookDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [addStatus, setAddStatus] = useState<string>("");


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


    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!book) return <p>Book not found.</p>;

    const cover = book.thumbnail?.replace("http://", "https://").replace("zoom=1", "zoom=2")
    return (
        <div className="book-detail-container">
            <h1>
                {book.title}
            </h1>
            <div className="book-cover">
                {cover && <img src={cover} alt={`${book.title} cover`} />}
            </div>
            <div className="book-detail">

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

                <p>Author: {book.authors?.join(", ")}</p>
                <p>Page Count: {book.pageCount}</p>
                <p>Average Rating: {book.averageRating && renderStars(book.averageRating)}</p>

                <div className="book-description">
                    {book.description && <div dangerouslySetInnerHTML={{ __html: book.description }} />}
                </div>

                <p>Genres: {book.categories?.join(", ")}</p>
                <p>Publisher: {book.publisher}</p>
                <p>Published Date: {book.publishedDate}</p>
                <p>ISBN: {book.isbn}</p>
                <p>Language: {book.language}</p>
                <p>Print Type: {book.printType}</p>
                <p>Ratings Count: {book.ratingsCount}</p>
            </div>


        </div>


    )
}