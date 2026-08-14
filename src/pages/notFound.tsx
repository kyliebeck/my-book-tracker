import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function NotFound() {
    useDocumentTitle("Page not found");

    return (
        <div className="notfound">
            <p className="eyebrow">Error 404</p>
            <h1>
                This page is
                <em>not on the shelf.</em>
            </h1>
            <p>
                The link may be broken, or the collection you're after might have been
                deleted or made private.
            </p>
            <div className="hero-actions">
                <Link className="btn-primary" to="/">
                    Back to Home
                </Link>
                <Link className="btn-ghost" to="/discover">
                    Discover Books
                </Link>
            </div>
        </div>
    );
}
