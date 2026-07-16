import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCollectionById, getBookIdsForCollection } from "../services/collections";
import { getBookById } from "../services/googleBooks";
import type { Book, Collection } from "../types";

export default function CollectionDetail() {
    const { id } = useParams<{ id: string }>();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!collection) return <p>Collection not found.</p>;

    return (
        <div>
            <h1>{collection.name}</h1>
            <p>{collection.description}</p>

            {books.length === 0 ? (
                <p>No books in this collection yet.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {books.map((book) => (
                        <li key={book.id} style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
                            {book.thumbnail && <img src={book.thumbnail} alt={book.title} />}
                            <div>
                                <strong>{book.title}</strong>
                                <div>{book.authors.join(", ")}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
