import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import CollectionCard from "../components/CollectionCard";
import useCollectionCovers from "../hooks/useCollectionCovers";
import { getPublicCollections, getBookCountsByCollection } from "../services/collections";
import { getProfilesByIds } from "../services/profiles";
import type { Collection } from "../types";
import { CollectionGridSkeleton, LoadingAnnouncement } from "../components/Skeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useScrollReveal from "../hooks/useScrollReveal";
import '../styles/community.css';



export default function Community() {
    const { user, loading: authLoading } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [names, setNames] = useState<Record<string, string>>({});
    const [counts, setCounts] = useState<Record<string, number>>({});

    useDocumentTitle("Community");

    useScrollReveal(collections);
    const covers = useCollectionCovers(collections.map((c) => c.id));


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
                setError("Couldn't load public shelves.");
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
                <strong>Sign in to look around</strong>
                See what other people keep on theirs.
            </div>
        );
    }

    return (
        <div className="community-container">
            <p className="eyebrow">Public Shelves</p>
            <h1>Community</h1>

            {loading && (
                <>
                    <LoadingAnnouncement label="Loading public shelves" />
                    <CollectionGridSkeleton />
                </>
            )}
            {error && <p className="error-text">{error}</p>}
            {!loading && collections.length === 0 && (
                <div className="empty-state">
                    <strong>Nothing public yet</strong>
                    Make one of your shelves public and it shows up here.
                </div>
            )}

            <ul className="collection-grid">
                {collections.map((c) => (
                    <li key={c.id}>
                        <CollectionCard
                            id={c.id}
                            name={c.name}
                            owner={names[c.ownerId] ?? "…"}
                            count={counts[c.id] ?? 0}
                            covers={covers[c.id]}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
