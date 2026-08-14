import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPopularBySubject } from "../services/openLibrary";
import Cover from "../components/Cover";
import { ShelfSkeleton } from "../components/Skeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";

/** Two rows of the most-shelved books in each subject, scrolling opposite ways. */
const SHELF_SUBJECTS = ["Fantasy", "Mystery"];

type ShelfBook = { title: string; src?: string };
type Spotlight = { title: string; author?: string; cover: string; readers: number };

export default function Home() {
    const [shelves, setShelves] = useState<ShelfBook[][]>([]);
    const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
    const [loadingShelves, setLoadingShelves] = useState(true);

    useDocumentTitle("Your reading, tracked");

    useEffect(() => {
        let ignore = false;
        Promise.all(SHELF_SUBJECTS.map((s) => getPopularBySubject(s)))
            .then((results) => {
                if (ignore) return;
                const rows = results.map((books) =>
                    books.map((b) => ({ title: b.title, src: b.coverUrl }))
                );
                // A short row leaves a visible gap as the marquee wraps.
                setShelves(rows.filter((r) => r.length >= 8));

                // Most-read book across every subject fetched — no extra request,
                // the readership numbers are already in the same response.
                const top = results
                    .flat()
                    .sort((a, b) => b.readers - a.readers)[0];
                if (top) {
                    setSpotlight({
                        title: top.title,
                        author: top.authors[0],
                        // -L is worth it here: this one renders at 152px, not 116px.
                        cover: top.coverUrl.replace("-M.jpg", "-L.jpg"),
                        readers: top.readers,
                    });
                }
            })
            .catch(console.error)
            .finally(() => {
                if (!ignore) setLoadingShelves(false);
            });
        return () => {
            ignore = true;
        };
    }, []);

    return (
        <div>
            <section className="hero">
                <p className="eyebrow">Your Library</p>
                <h1>
                    Every book you've
                    <em>ever loved.</em>
                </h1>
                <p className="hero-lede">
                    Build collections, track what you're reading, and see what the
                    shelves of other readers look like.
                </p>
                <div className="hero-actions">
                    <Link className="btn-primary" to="/collections">
                        Your Collections
                    </Link>
                    <Link className="btn-ghost" to="/discover">
                        Discover Books
                    </Link>
                </div>
            </section>

            {spotlight && (
                <section className="spotlight">
                    <div className="spotlight-backdrop" aria-hidden="true">
                        <img src={spotlight.cover} alt="" />
                    </div>
                    <div className="spotlight-inner">
                        <Cover src={spotlight.cover} title={spotlight.title} eager />
                        <div className="spotlight-body">
                            <p className="eyebrow">Most read right now</p>
                            <h2 className="spotlight-title">{spotlight.title}</h2>
                            {spotlight.author && (
                                <p className="spotlight-author">{spotlight.author}</p>
                            )}
                            <p className="spotlight-readers">
                                On {spotlight.readers.toLocaleString()} shelves
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {loadingShelves && <ShelfSkeleton />}

            {/* Decoration, so it's hidden from screen readers wholesale rather
                than read out as a long list of duplicated titles. */}
            {shelves.map((row, i) => (
                <div className="shelf" key={i} aria-hidden="true">
                    {/* Rendered twice so the -50% keyframe wraps seamlessly. */}
                    <div className={`shelf-track${i % 2 ? " reverse" : ""}`}>
                        {[...row, ...row].map((book, j) => (
                            <div className="shelf-item" key={j}>
                                {/* Eager, not lazy: the marquee moves covers with a CSS
                                    transform, which never triggers lazy loading, so the
                                    duplicated half stayed permanently blank. The duplicate
                                    shares its URL with the original, so this costs no
                                    extra requests — the second copy is served from cache. */}
                                <Cover src={book.src} title={book.title} eager />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
