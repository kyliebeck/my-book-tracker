import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { getPublicCollections, getBookCountsByCollection } from "../services/collections";
import { getProfilesByIds } from "../services/profiles";
import type { Collection } from "../types";
import { CollectionGridSkeleton, LoadingAnnouncement } from "../components/Skeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import '../styles/community.css';



export default function Community() {
    const { user, loading: authLoading } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [names, setNames] = useState<Record<string, string>>({});
    const [counts, setCounts] = useState<Record<string, number>>({});

    useDocumentTitle("Community");


    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const data = await getPublicCollections();
                if (ignore) return;
                setCollections(data);

                const ownerIds = [...new Set(data.map((c) => c.ownerId))];
                // Owner names and book counts are independent — fetch together.
                const [profiles, bookCounts] = await Promise.all([
                    getProfilesByIds(ownerIds),
                    getBookCountsByCollection(data.map((c) => c.id)),
                ]);
                if (ignore) return;
                setNames(Object.fromEntries(profiles.map((p) => [p.id, p.displayName])));
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
        return () => { ignore = true; };
    }, []);


    if (authLoading) return <CollectionGridSkeleton />;
    if (!user) {
        return (
            <div className="empty-state">
                <strong>Sign in to browse the community</strong>
                See public shelves built by other readers.
            </div>
        );
    }

    return (
        <div className="community-container">
            <p className="eyebrow">Public Shelves</p>
            <h1>Community</h1>

            {loading && (
                <>
                    <LoadingAnnouncement label="Loading public collections" />
                    <CollectionGridSkeleton />
                </>
            )}
            {error && <p className="error-text">{error}</p>}
            {!loading && collections.length === 0 && (
                <div className="empty-state">
                    <strong>No public shelves yet</strong>
                    When someone marks a collection public, it'll appear here.
                </div>
            )}

            <ul className="collection-grid">
                {collections.map((c) => (
                    <li key={c.id}>
                        <Link className="collection-card" to={`/collections/${c.id}`}>
                            <span className="collection-card-name">{c.name}</span>
                            <span className="collection-card-meta">
                                <span className="collection-card-owner">
                                    by {names[c.ownerId] ?? "…"}
                                </span>
                                <span>
                                    {counts[c.id] ?? 0}{" "}
                                    {counts[c.id] === 1 ? "book" : "books"}
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
