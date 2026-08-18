import { useState } from "react";

/**
 * A book cover in a fixed 2:3 frame.
 *
 * Google Books lies about covers: for volumes it has no artwork for, it still
 * populates `imageLinks.thumbnail`, then serves a 300x48 grey banner. Dropped
 * into a 2:3 box with `object-fit: cover`, that strip gets scaled up ~9x and
 * renders as two giant unreadable letters. There is no way to tell from the
 * URL, so the only reliable check is measuring the image once it loads and
 * rejecting anything that isn't roughly portrait.
 */
const MIN_RATIO = 0.5;
const MAX_RATIO = 0.85;

/**
 * Google's "image not available" graphic, measured at the `zoom=2` that
 * coverUrl() requests. It's the same file for every coverless volume, and
 * nothing in the URL distinguishes it from real artwork — but real covers come
 * back 300x450 to 300x481, so these exact dimensions are a reliable tell.
 */
const PLACEHOLDER_SIZES = new Set(["300x391"]);

/** True if a loaded image is actually usable cover artwork. */
function isCoverShaped(width: number, height: number): boolean {
    if (!height) return false;
    if (PLACEHOLDER_SIZES.has(`${width}x${height}`)) return false;
    const ratio = width / height;
    return ratio >= MIN_RATIO && ratio <= MAX_RATIO;
}

type Props = {
    src?: string;
    title: string;
    /** Decorative covers (the home shelf) get no alt text and no fallback label. */
    decorative?: boolean;
    eager?: boolean;
    /** Shows a brass check in the corner when you've finished this book. */
    finished?: boolean;
};

/** Corner check. Not aria-hidden: "finished" isn't conveyable any other way here. */
function FinishedMark({ title }: { title: string }) {
    return (
        <span className="cover-finished" title={`You finished ${title}`}>
            <span className="visually-hidden">Finished</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                    d="M4 12.5l5.5 5.5L20 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}

export default function Cover({
    src,
    title,
    decorative = false,
    eager = false,
    finished = false,
}: Props) {
    const [unusable, setUnusable] = useState(false);

    if (!src || unusable) {
        return (
            <div className="cover cover-empty">
                {decorative ? null : title}
                {finished && <FinishedMark title={title} />}
            </div>
        );
    }

    return (
        <div className="cover">
            <img
                src={src}
                alt={decorative ? "" : `${title} cover`}
                loading={eager ? "eager" : "lazy"}
                onError={() => setUnusable(true)}
                onLoad={(e) => {
                    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                    if (!isCoverShaped(w, h)) setUnusable(true);
                }}
            />
            {finished && <FinishedMark title={title} />}
        </div>
    );
}
