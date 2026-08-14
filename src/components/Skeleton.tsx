/**
 * Loading placeholders that reuse the real layout classes (`book-list`,
 * `collection-grid`) so the skeleton occupies the exact geometry the content
 * will. That's what stops the page jumping when data arrives — a shimmer in
 * the wrong shape just moves the layout shift around.
 */

export function BookGridSkeleton({ count = 10 }: { count?: number }) {
    return (
        <ul className="book-list" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <li className="book-item" key={i}>
                    <div className="skeleton skeleton-cover" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                </li>
            ))}
        </ul>
    );
}

export function CollectionGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <ul className="collection-grid" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <li key={i}>
                    <div className="skeleton skeleton-card" />
                </li>
            ))}
        </ul>
    );
}

export function BookDetailSkeleton() {
    return (
        <div className="book-detail-container" aria-hidden="true">
            <div className="book-cover">
                <div className="skeleton skeleton-cover" />
            </div>
            <div className="book-detail">
                <div className="skeleton skeleton-block" style={{ height: 44, width: "62%" }} />
                <div className="skeleton skeleton-block" style={{ width: "34%" }} />
                <div className="skeleton skeleton-block" style={{ marginTop: 28 }} />
                <div className="skeleton skeleton-block" />
                <div className="skeleton skeleton-block" style={{ width: "78%" }} />
                <div className="skeleton skeleton-block" style={{ width: "88%" }} />
            </div>
        </div>
    );
}

/** Screen-reader announcement to pair with any visual skeleton. */
export function LoadingAnnouncement({ label = "Loading" }: { label?: string }) {
    return (
        <span role="status" aria-live="polite" className="visually-hidden">
            {label}
        </span>
    );
}
