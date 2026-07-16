import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { getMyCollections, createCollection, } from "../services/collections";
import type { Collection } from "../types";
import '../styles/collections.css';
import { Link } from "react-router-dom";

export default function Collections() {
    const { user, loading: authLoading } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const data = await getMyCollections();
            setCollections(data);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Could not load collections.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        let ignore = false;
        getMyCollections()
            .then((data) => {
                if (ignore) return;
                setCollections(data);
                setError("");
            })
            .catch((err) => {
                if (ignore) return;
                console.error(err);
                setError("Could not load collections.");
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, [user]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !user) return;
        try {
            await createCollection(name, user.id);
            setName("");
            load();
        } catch (err) {
            console.error(err);
            setError("Could not create collection.");
        }
    }


    if (authLoading) return <p>Loading...</p>;
    if (!user) return <p>Please log in to see your collections.</p>;

    return (
        <main>
            <div className="collections-container">
                <h1>My Collections</h1>

                <form className="collection-form"
                    onSubmit={handleCreate}>
                    <input
                        className="collection-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="New collection name"
                    />
                    <button type="submit">Create</button>
                </form>

                {loading && <p>Loading...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}

                <ul className="collection-list">
                    {collections.map((c) => (
                        <li 
                        className="collection-item"
                            key={c.id}>
                            <Link to={`/collections/${c.id}`}>
                                {c.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
}