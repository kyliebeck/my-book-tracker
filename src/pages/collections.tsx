import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { getMyCollections, createCollection, deleteCollection } from "../services/collections";
import type { Collection } from "../types";

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

    async function handleDelete(id: string) {
        await deleteCollection(id);
        load();
    }

    if (authLoading) return <p>Loading...</p>;
    if (!user) return <p>Please log in to see your collections.</p>;

    return (
        <div>
            <h1>My Collections</h1>

            <form onSubmit={handleCreate}>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New collection name"
                />
                <button type="submit">Create</button>
            </form>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <ul>
                {collections.map((c) => (
                    <li key={c.id}>
                        {c.name}
                        <button onClick={() => handleDelete(c.id)} style={{ marginLeft: "1rem" }}>
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}