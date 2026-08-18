import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function NotFound() {
    useDocumentTitle("Page not found");

    return (
        <div className="notfound">
            <p className="eyebrow">Error 404</p>
            <h1>
                Not on the
                <em>nightstand.</em>
            </h1>
            <p>
                This page doesn't exist, or the shelf was deleted or made private.
            </p>
            <div className="hero-actions">
                <Link className="btn-primary" to="/">
                    Go home
                </Link>
                <Link className="btn-ghost" to="/discover">
                    Find books
                </Link>
            </div>
        </div>
    );
}
