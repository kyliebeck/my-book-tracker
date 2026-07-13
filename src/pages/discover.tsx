import { useState } from "react";
import { searchBooks } from "../services/googleBooks";
import type { Book } from "../types";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getMyCollections, addBookToCollection } from "../services/collections";

export default function Discover() {
    const [query, setQuery] = useState("");
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const results = await searchBooks(query);
            setBooks(results);
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    }

    const { user } = useAuth();
    const [collections, setCollections] = useState<any[]>([]);

    useEffect(() => {
        if (user) getMyCollections().then(setCollections).catch(console.error);
    }, [user]);

    async function handleAdd(collectionId: string, bookId: string) {
        try {
            await addBookToCollection(collectionId, bookId);
            alert("Added!");
        } catch (err) {
            console.error(err);
            alert("Could not add — maybe it's already in that collection.");
        }
    }

    return (
        <div>
            <h1>Discover</h1>
            <form onSubmit={handleSearch}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for books..."
                />
                <button type="submit">Search</button>
            </form>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <ul style={{ listStyle: "none", padding: 0 }}>
                {books.map((book) => (
                    <li key={book.id} style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
                        {book.thumbnail && <img src={book.thumbnail} alt={book.title} />}
                        <div>
                            <strong>{book.title}</strong>
                            <div>{book.authors.join(", ")}</div>
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
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}