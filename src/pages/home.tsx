import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPopularBySubject } from "../services/openLibrary";
import Cover from "../components/Cover";
import useDocumentTitle from "../hooks/useDocumentTitle";

/** Two rows of the most-shelved books in each subject, scrolling opposite ways. */
const SHELF_SUBJECTS = ["Fantasy", "Mystery"];

type ShelfBook = { title: string; src?: string };

export default function Home() {
    const [shelves, setShelves] = useState<ShelfBook[][]>([]);

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
            })
            .catch(console.error);
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

            {/* Decoration, so it's hidden from screen readers wholesale rather
                than read out as a long list of duplicated titles. */}
            {shelves.map((row, i) => (
                <div className="shelf" key={i} aria-hidden="true">
                    {/* Rendered twice so the -50% keyframe wraps seamlessly. */}
                    <div className={`shelf-track${i % 2 ? " reverse" : ""}`}>
                        {[...row, ...row].map((book, j) => (
                            <div className="shelf-item" key={j}>
                                <Cover src={book.src} title={book.title} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
