# recommend-books

Backs the "Recommend my next read" button on a shelf. The browser posts a shelf
name and its books; this function prompts Claude and returns three suggestions
with a one-line reason each.

## Why it's a function and not front-end code

Nightstand is a static site — every `VITE_*` variable ends up readable in the
shipped JavaScript. That's fine for the Supabase anon key (RLS is the real
boundary) and survivable for the Google Books key (restricted by referrer), but
an Anthropic key in the bundle is a key anyone can spend. So the key lives here
as a Supabase secret, and the browser never sees it.

## Deploy

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy recommend-books
```

Run locally with `supabase functions serve recommend-books` — it reads
`supabase/.env` for the secret (keep that file out of git).

No front-end environment variables are needed: `supabase.functions.invoke`
already authenticates with the anon key the app is configured with.

## Contract

Request:

```json
{ "shelfName": "Winter reading", "books": [{ "title": "Dune", "authors": ["Frank Herbert"] }] }
```

Response:

```json
{ "recommendations": [{ "title": "...", "author": "...", "reason": "..." }] }
```

Errors return `{ "error": "..." }` with a 4xx/5xx status. The detail is logged
server-side rather than returned, since upstream errors can echo request
content.

## Notes

- The response shape is enforced with `output_config.format` (a zod schema), so
  the model can't return prose or fenced JSON that needs unwrapping.
- The shelf is capped at 40 books before it goes into the prompt — enough to
  read someone's taste, without paying for a 300-book list.
- Titles and authors from the client are validated and length-capped before
  they're interpolated into the prompt.
