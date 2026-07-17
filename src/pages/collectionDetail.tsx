import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCollectionById, getBookIdsForCollection, addBookToCollection } from "../services/collections";
import { getBookById, searchBooks } from "../services/googleBooks";
import { useAuth } from "../hooks/useAuth";
import type { Book, Collection } from "../types";

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
            if (added) setBooks((prev) => [...prev, added]);
        } catch (err) {
            console.error(err);
            alert("Could not add — maybe it's already in that collection.");
        }
    }

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!collection) return <p>Collection not found.</p>;

    const addedIds = new Set(books.map((b) => b.id));

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

            {user && (
                <div style={{ marginTop: "2rem" }}>
                    <h2>Add a book</h2>
                    <form onSubmit={handleSearch}>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for books..."
                        />
                        <button type="submit">Search</button>
                    </form>

                    {searching && <p>Loading...</p>}
                    {searchError && <p style={{ color: "red" }}>{searchError}</p>}

                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {searchResults.map((book) => {
                            const alreadyAdded = addedIds.has(book.id);
                            return (
                                <li key={book.id} style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
                                    {book.thumbnail && <img src={book.thumbnail} alt={book.title} />}
                                    <div>
                                        <strong>{book.title}</strong>
                                        <div>{book.authors.join(", ")}</div>
                                        {alreadyAdded ? (
                                            <span>Already in this collection</span>
                                        ) : (
                                            <button onClick={() => handleAdd(book.id)}>Add to collection</button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
