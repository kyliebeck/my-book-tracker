import { supabase } from "../lib/supabase";

/**
 * Which books you've finished.
 *
 * Deliberately its own table rather than a column on `collection_books`:
 * "finished" belongs to you and a book, not to a shelf. A book can sit on two
 * shelves (or none at all — Book Detail is reachable straight from Discover),
 * and it should read the same everywhere.
 *
 * Rows store `finished_at` rather than a boolean. The checkbox state is just
 * "does a row exist", but keeping the date costs nothing and is what any
 * later "books I read this year" view would need.
 *
 * Every policy on this table is scoped to auth.uid(), so selects come back
 * pre-filtered to the signed-in user and no owner filter is needed here.
 */

async function currentUserId(): Promise<string | undefined> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
}

/** ISO timestamp if the book is marked finished, otherwise null. */
export async function getFinishedAt(bookId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from("read_books")
        .select("finished_at")
        .eq("book_id", bookId)
        .maybeSingle();
    if (error) throw error;
    return data?.finished_at ?? null;
}

export async function markFinished(bookId: string): Promise<void> {
    const userId = await currentUserId();
    if (!userId) throw new Error("Not signed in.");
    // Upsert so a double-click can't fail on the composite primary key.
    const { error } = await supabase
        .from("read_books")
        .upsert({ user_id: userId, book_id: bookId }, { onConflict: "user_id,book_id" });
    if (error) throw error;
}

export async function unmarkFinished(bookId: string): Promise<void> {
    const { error } = await supabase
        .from("read_books")
        .delete()
        .eq("book_id", bookId);
    if (error) throw error;
}

/**
 * Finished ids for a batch of books, in one round trip — the primitive for
 * showing markers across a grid without a query per cover.
 */
export async function getFinishedIds(bookIds: string[]): Promise<Set<string>> {
    if (bookIds.length === 0) return new Set();
    const { data, error } = await supabase
        .from("read_books")
        .select("book_id")
        .in("book_id", bookIds);
    if (error) throw error;
    return new Set((data ?? []).map((row) => row.book_id as string));
}
