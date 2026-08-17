import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    getMyCollections,
    createCollection,
    getBookCountsByCollection,
} from "../services/collections";

import type { Collection } from "../types";
import { CollectionGridSkeleton, LoadingAnnouncement } from "../components/Skeleton";
import { useLocation } from "react-router-dom";
import CollectionCard from "../components/CollectionCard";
import Toast, { type ToastState } from "../components/Toast";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useScrollReveal from "../hooks/useScrollReveal";
import useCollectionCovers from "../hooks/useCollectionCovers";
import '../styles/collections.css';

export default function Collections() {
    const { user, loading: authLoading } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Deleting navigates back here; confirm it happened rather than silently
    // showing a shorter list.
    const location = useLocation();
    const [toast, setToast] = useState<ToastState>(
        (location.state as { deleted?: string } | null)?.deleted
            ? { message: `Deleted "${(location.state as { deleted: string }).deleted}".` }
            : null
    );

    // Clear the router state once consumed, or reloading this page would
    // replay "Deleted …" for a deletion that already happened.
    useEffect(() => {
        if ((location.state as { deleted?: string } | null)?.deleted) {
            window.history.replaceState({}, "");
        }
    }, [location.state]);

    useDocumentTitle("My Collections");

    useScrollReveal(collections);
    const covers = useCollectionCovers(collections.map((c) => c.id));

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
                        <CollectionCard
                            id={c.id}
                            name={c.name}
                            count={counts[c.id] ?? 0}
                            covers={covers[c.id]}
                            isPublic={c.isPublic}
                        />
                    </li>
                ))}
            </ul>

            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}