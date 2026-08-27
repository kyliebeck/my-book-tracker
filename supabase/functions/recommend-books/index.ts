/**
 * recommend-books — "Recommend my next read".
 *
 * Nightstand is a static site, so there is no server of ours to hide an API
 * key behind. Calling Anthropic straight from React would ship the key in the
 * bundle for anyone to read out of dev tools. This function is the server:
 * the browser posts a shelf, the key lives here as a Supabase secret, and only
 * the finished recommendations travel back.
 */
import Anthropic from "npm:@anthropic-ai/sdk@0.121.0";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@0.121.0/helpers/zod";
import { z } from "npm:zod@4.4.3";

const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, "content-type": "application/json" },
    });

/**
 * The schema is the contract. Passing it as `output_config.format` makes the
 * API constrain generation to this shape, so we never hand-parse a reply or
 * strip markdown fences off it — a malformed response can't reach the UI.
 */
const Recommendations = z.object({
    recommendations: z
        .array(
            z.object({
                title: z.string(),
                author: z.string(),
                reason: z.string(),
            })
        )
        .length(3),
});

type IncomingBook = { title?: unknown; authors?: unknown };

/** Trust nothing from the browser: this text goes straight into a prompt. */
function describe(book: IncomingBook): string | null {
    if (typeof book?.title !== "string" || !book.title.trim()) return null;
    const title = book.title.trim().slice(0, 200);
    const authors = Array.isArray(book.authors)
        ? book.authors.filter((a): a is string => typeof a === "string").join(", ")
        : typeof book.authors === "string"
          ? book.authors
          : "";
    return authors ? `- ${title} by ${authors.slice(0, 200)}` : `- ${title}`;
}

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return json({ error: "Use POST." }, 405);

    try {
        const { shelfName, books } = await req.json();

        // Cap the list: a 300-book shelf would be a large prompt for no gain,
        // and the model only needs enough of it to read the taste.
        const bookList = (Array.isArray(books) ? books : [])
            .slice(0, 40)
            .map(describe)
            .filter(Boolean)
            .join("\n");

        if (!bookList) return json({ error: "That shelf has nothing to go on." }, 400);

        const shelf = typeof shelfName === "string" ? shelfName.slice(0, 120) : "Untitled";

        const response = await client.messages.parse({
            model: "claude-opus-5",
            // Roomy: thinking is on by default, and running out mid-answer
            // would come back as an unparsed response rather than a short one.
            max_tokens: 16000,
            system:
                "You are a well-read bookseller. You recommend real, published books — " +
                "never invented titles — and you explain each pick in one plain sentence " +
                "that points at something specific in the reader's shelf.",
            messages: [
                {
                    role: "user",
                    content: `A reader has a shelf called "${shelf}" with these books:
${bookList}

Recommend 3 books they would likely enjoy next. None of them may already be on the shelf above.`,
                },
            ],
            // "medium" keeps the wait and the bill down; picking three books
            // off a short list isn't work that repays deeper thinking.
            output_config: {
                effort: "medium",
                format: zodOutputFormat(Recommendations),
            },
        });

        // parsed_output is null if the model stopped early (e.g. max_tokens).
        if (!response.parsed_output) {
            console.error("No parsed output", response.stop_reason);
            return json({ error: "Could not generate recommendations" }, 502);
        }

        return json({ recommendations: response.parsed_output.recommendations });
    } catch (err) {
        // Log the detail, return a generic message — upstream errors can carry
        // request content, and that isn't the browser's business.
        console.error(err);
        return json({ error: "Could not generate recommendations" }, 500);
    }
});
