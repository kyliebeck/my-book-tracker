import { Link } from "react-router-dom";

type Props = {
    id: string;
    name: string;
    count?: number;
    /** How many of this shelf's books you've finished. Omit to just show the count. */
    readCount?: number;
    /** Cover URLs for the fanned stack; may be empty while loading or if the shelf is empty. */
    covers?: string[];
    owner?: string;
    isPublic?: boolean;
};

/**
 * Shared by Collections and Community. The fanned cover stack is what makes a
 * shelf read as a shelf rather than a text row — it's the same visual language
 * as the book grid, at card scale.
 */
export default function CollectionCard({
    id,
    name,
    count,
    readCount,
    covers = [],
    owner,
    isPublic,
}: Props) {
    // "0 of 12 read" is a bleak thing to show someone, so only switch to the
    // progress phrasing once there's progress to report.
    const showProgress = readCount != null && readCount > 0 && (count ?? 0) > 0;
    return (
        <Link className="collection-card" to={`/collections/${id}`}>
            {covers.length > 0 && (
                <span className="card-stack" aria-hidden="true">
                    {covers.map((url, i) => (
                        <span className="card-spine" key={i} style={{ zIndex: covers.length - i }}>
                            <img src={url} alt="" loading="lazy" />
                        </span>
                    ))}
                </span>
            )}

            <span className="collection-card-name">{name}</span>

            <span className="collection-card-meta">
                {owner && <span className="collection-card-owner">by {owner}</span>}
                {count != null &&
                    (showProgress ? (
                        <span className="collection-card-progress">
                            {readCount} of {count} read
                        </span>
                    ) : (
                        <span>
                            {count} {count === 1 ? "book" : "books"}
                        </span>
                    ))}
                {isPublic && <span className="collection-badge">Public</span>}
            </span>
        </Link>
    );
}
