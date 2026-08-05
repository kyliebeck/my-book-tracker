import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { getPublicCollections } from "../services/collections";
import { getProfilesByIds } from "../services/profiles";
import type { Collection } from "../types";
import '../styles/community.css';



export default function Community() {
    const { user, loading: authLoading } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [names, setNames] = useState<Record<string, string>>({});


    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const data = await getPublicCollections();
                if (ignore) return;
                setCollections(data);

                const ownerIds = [...new Set(data.map((c) => c.ownerId))];   
                const profiles = await getProfilesByIds(ownerIds);
                if (ignore) return;
                setNames(Object.fromEntries(profiles.map((p) => [p.id, p.displayName]))); 
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


    if (authLoading) return <p>Loading...</p>;
    if (!user) return <p>Please log in to browse the community.</p>;

    return (
        <main>
            <div className="community-container">
                <h1 className="community-title">Community</h1>

                {loading && <p>Loading...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {!loading && collections.length === 0 && <p>No public collections yet.</p>}

                <ul className="community-list">
                    {collections.map((c) => (
                        <li
                            className="community-item"
                            key={c.id}>
                            <Link to={`/collections/${c.id}`}>
                                {c.name}
                                <span>by {names[c.ownerId] ?? "…"}</span>

                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
}
