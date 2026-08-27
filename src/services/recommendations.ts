import { supabase } from "../lib/supabase";
import type { Book } from "../types";

export interface Recommendation {
    title: string;
    author: string;
    reason: string;
}

/**
 * Asks the `recommend-books` edge function for three books that suit a shelf.
 *
 * The LLM call lives in the function, not here, so the Anthropic key never
 * reaches the bundle. The browser only ever sees the finished list.
 */
export async function getRecommendations(
    shelfName: string,
    books: Book[]
): Promise<Recommendation[]> {
    const { data, error } = await supabase.functions.invoke<{
        recommendations?: Recommendation[];
    }>("recommend-books", {
        // Only what the prompt needs — no ids, covers, or descriptions.
        body: {
            shelfName,
            books: books.map((b) => ({ title: b.title, authors: b.authors })),
        },
    });

    if (error) throw error;
    return data?.recommendations ?? [];
}
