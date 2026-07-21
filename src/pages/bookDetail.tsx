import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getBookById } from "../services/googleBooks";
import type { Book } from "../types";




export default function BookDetail() {
    const { id } = useParams<{ id: string }>();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (!id) return;
        let ignore = false;
        (async () => {
            try {
                const bookData = await getBookById(id);
                if (ignore) return;
                setBook(bookData);
                setError(null);
            } catch (err) {
                if (ignore) return;
                console.error(err);
                setError("Could not load book.");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!book) return <p>Book not found.</p>;



    const cover = book.thumbnail?.replace("http://", "https://").replace("zoom=1", "zoom=2")
    return (
        <div>
            <h1>
                {book.title}

            </h1>
            <div className="book-cover">
                {cover && <img src={cover} alt={`${book.title} cover`} />}
            </div>
            <div className="book-detail">
                <p>Author: {book.authors?.join(", ")}</p>
                <p>Publisher: {book.publisher}</p>
                <p>Published Date: {book.publishedDate}</p>
                <p>Page Count: {book.pageCount}</p>
                {book.description && <div dangerouslySetInnerHTML={{ __html: book.description }} />}



                <p>Categories: {book.categories?.join(", ")}</p>

                <p>ISBN: {book.isbn}</p>
                <p>Language: {book.language}</p>
                <p>Print Type: {book.printType}</p>
                <p>Average Rating: {book.averageRating}</p>
                <p>Ratings Count: {book.ratingsCount}</p>



            </div>


        </div>


    )
}