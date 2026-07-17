import { useState } from "react";
import { Link } from "react-router-dom";
import { searchBooks, searchByGenre } from "../services/googleBooks";
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

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setActiveGenre(null);
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

    async function handleGenreClick(genre: string) {
        setQuery("");
        setActiveGenre(genre);
        setLoading(true);
        setError("");
        try {
            const results = await searchByGenre(genre);
            setBooks(results);
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

            <form onSubmit={handleSearch}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for books..."
                />
                <button type="submit">Search</button>
            </form>

            {loading && <p>Loading...</p>}
            {error && <p className="error-text">{error}</p>}

            <ul className="book-list">
                {books.map((book) => (
                    <li key={book.id} className="book-item">
                        <Link to={`/books/${book.id}`} className="book-link">
                            {book.thumbnail && <img src={book.thumbnail} alt={book.title} />}
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
        </div>
    );
}