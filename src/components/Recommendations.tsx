import { useState } from "react";
import { Link } from "react-router-dom";
import {
    getRecommendations,
    RecommendationRefused,
    type Recommendation,
} from "../services/recommendations";
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
    // Runs left today, once the function has told us. Null until then, so a
    // shelf that hasn't been asked yet doesn't announce a quota nobody hit.
    const [remaining, setRemaining] = useState<number | null>(null);
    // A refusal isn't a glitch — being out of runs for the day means the
    // button has nothing left to do, so it stops offering.
    const [exhausted, setExhausted] = useState(false);

    async function handleClick() {
        setLoading(true);
        setError("");
        try {
            const result = await getRecommendations(shelfName, books);
            if (result.recommendations.length === 0) {
                setError("Nothing came back this time. Try again.");
            }
            setRecs(result.recommendations);
            setRemaining(result.remaining);
        } catch (err) {
            console.error(err);
            if (err instanceof RecommendationRefused) {
                // The function wrote this for the reader; pass it through.
                setError(err.message);
                setExhausted(err.status === 429);
                if (err.status === 429) setRemaining(0);
            } else {
                setError("Couldn't get recommendations right now. Try again.");
            }
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
                        {/* Each press is a real API call that costs real
                            money, so there's a daily cap. Say so once it's
                            close enough to matter rather than surprising
                            someone with it. */}
                        {remaining !== null && remaining <= 3 && (
                            <>
                                {" "}
                                {remaining === 0
                                    ? "No runs left today."
                                    : `${remaining} left today.`}
                            </>
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    className="recs-btn"
                    onClick={handleClick}
                    disabled={loading || exhausted}
                >
                    {loading
                        ? "Thinking…"
                        : exhausted
                          ? "Back tomorrow"
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
