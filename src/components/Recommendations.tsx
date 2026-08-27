import { useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendations, type Recommendation } from "../services/recommendations";
import { LoadingAnnouncement } from "./Skeleton";
import type { Book } from "../types";

type Props = {
    shelfName: string;
    books: Book[];
};

/**
 * "Recommend my next read" — one button, three cards.
 *
 * Owns its own loading and error state rather than pushing it up into
 * CollectionDetail, because nothing else on the page cares about it.
 */
export default function Recommendations({ shelfName, books }: Props) {
    const [recs, setRecs] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleClick() {
        setLoading(true);
        setError("");
        try {
            const results = await getRecommendations(shelfName, books);
            if (results.length === 0) {
                setError("Nothing came back this time. Try again.");
            }
            setRecs(results);
        } catch (err) {
            console.error(err);
            setError("Couldn't get recommendations right now. Try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="recs">
            <div className="recs-head">
                <div>
                    <h2>What next?</h2>
                    <p className="recs-sub">
                        Reads this shelf and suggests three books to follow it.
                    </p>
                </div>
                <button
                    type="button"
                    className="recs-btn"
                    onClick={handleClick}
                    disabled={loading}
                >
                    {loading
                        ? "Thinking…"
                        : recs.length
                          ? "Try again"
                          : "Recommend my next read"}
                </button>
            </div>

            {/* The button label changes, but the wait itself should be
                announced too — same treatment as the search skeletons. */}
            {loading && <LoadingAnnouncement label="Finding recommendations" />}

            {error && <p className="error-text">{error}</p>}

            {recs.length > 0 && (
                <ul className="rec-list">
                    {recs.map((rec) => (
                        <li key={`${rec.title}-${rec.author}`} className="rec-card">
                            <h3>{rec.title}</h3>
                            <div className="rec-author">{rec.author}</div>
                            <p className="rec-reason">{rec.reason}</p>
                            {/* Closes the loop: search Nightstand for the pick,
                                where the existing add-to-shelf flow takes over. */}
                            <Link
                                className="rec-find"
                                to={`/discover?q=${encodeURIComponent(`${rec.title} ${rec.author}`)}`}
                            >
                                Find it →
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
