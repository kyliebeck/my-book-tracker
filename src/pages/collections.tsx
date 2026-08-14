import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    getMyCollections,
    createCollection,
    getBookCountsByCollection,
} from "../services/collections";

import type { Collection } from "../types";
import { CollectionGridSkeleton, LoadingAnnouncement } from "../components/Skeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import '../styles/collections.css';
import { Link } from "react-router-dom";

export default function Collections() {
    const { user, loading: authLoading } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useDocumentTitle("My Collections");

    // Single fetch path, used both on mount and after creating a collection.
    const load = useCallback(async () => {
        try {
            const data = await getMyCollections();
            setCollections(data);
            setCounts(await getBookCountsByCollection(data.map((c) => c.id)));
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
        (async () => {
            try {
                const data = await getMyCollections();
                const bookCounts = await getBookCountsByCollection(
                    data.map((c) => c.id)
                );
                if (ignore) return;
                setCollections(data);
                setCounts(bookCounts);
                setError("");
            } catch (err) {
                if (ignore) return;
                console.error(err);
                setError("Could not load collections.");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [user]);



    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !user) return;
        try {
            await createCollection(name, user.id, undefined, isPublic);
            setName("");
            setIsPublic(false);
            load();
        } catch (err) {
            console.error(err);
            setError("Could not create collection.");
        }
    }


    if (authLoading) return <CollectionGridSkeleton />;
    if (!user) {
        return (
            <div className="empty-state">
                <strong>Sign in to see your collections</strong>
                Your shelves are private to your account.
            </div>
        );
    }

    return (
        <div className="collections-container">
            <p className="eyebrow">Your Shelves</p>
            <h1>My Collections</h1>

            <form className="collection-form" onSubmit={handleCreate}>
                <input
                    className="collection-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New collection name"
                />
                <label className="collection-public-toggle">
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    Public
                </label>
                <button type="submit">Create</button>
            </form>

            {loading && (
                <>
                    <LoadingAnnouncement label="Loading collections" />
                    <CollectionGridSkeleton />
                </>
            )}
            {error && <p className="error-text">{error}</p>}

            {!loading && collections.length === 0 && (
                <div className="empty-state">
                    <strong>No shelves yet</strong>
                    Name one above to start collecting — mark it public and it'll
                    show up on the Community page.
                </div>
            )}

            <ul className="collection-grid">
                {collections.map((c) => (
                    <li key={c.id}>
                        <Link className="collection-card" to={`/collections/${c.id}`}>
                            <span className="collection-card-name">{c.name}</span>
                            <span className="collection-card-meta">
                                <span>
                                    {counts[c.id] ?? 0}{" "}
                                    {counts[c.id] === 1 ? "book" : "books"}
                                </span>
                                {c.isPublic && (
                                    <span className="collection-badge">Public</span>
                                )}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}