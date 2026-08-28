import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Book } from "../types";

export interface Recommendation {
    title: string;
    author: string;
    reason: string;
}

export interface RecommendationResult {
    recommendations: Recommendation[];
    /** Runs left today after this one, or null if the function didn't say. */
    remaining: number | null;
}

/**
 * Thrown when the function turned the request down for a reason the reader
 * should read verbatim — signed out, or out of runs for today. Everything else
 * stays a generic failure, because upstream errors aren't the reader's
 * business.
 */
export class RecommendationRefused extends Error {
    // Assigned in the body rather than as a parameter property: the project
    // builds with `erasableSyntaxOnly`, which rules those out.
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "RecommendationRefused";
        this.status = status;
    }
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
): Promise<RecommendationResult> {
    const { data, error } = await supabase.functions.invoke<{
        recommendations?: Recommendation[];
        remaining?: number;
    }>("recommend-books", {
        // Only what the prompt needs — no ids, covers, or descriptions.
        body: {
            shelfName,
            books: books.map((b) => ({ title: b.title, authors: b.authors })),
        },
    });

    if (error) {
        // invoke collapses every non-2xx into one opaque error; the JSON body
        // carrying our message is on `context` and only arrives if we read it.
        if (error instanceof FunctionsHttpError) {
            const status = error.context.status;
            if (status === 401 || status === 429) {
                const body = await error.context.json().catch(() => null);
                if (typeof body?.error === "string") {
                    throw new RecommendationRefused(body.error, status);
                }
            }
        }
        throw error;
    }

    return {
        recommendations: data?.recommendations ?? [],
        remaining: typeof data?.remaining === "number" ? data.remaining : null,
    };
}
