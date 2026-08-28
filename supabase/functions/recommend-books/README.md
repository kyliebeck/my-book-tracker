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

## Who's allowed to call it

The gateway's JWT check passes the anon key, and the anon key is in the
bundle — so it proves nothing about who sent the request, while every request
spends real money at Anthropic. Two things close that:

1. The bearer token is validated against the auth server, so a call has to
   carry a real signed-in session. No session, `401`.
2. Each call claims a slot from a per-user daily counter in Postgres before it
   prompts the model. Out of slots, `429`.

The counter is `public.rec_usage`, created by [`usage-limit.sql`](usage-limit.sql)
along with the `claim_recommendation` function that increments it atomically.
RLS denies every client role on that table, so a reader can neither read nor
reset their own count — only this function, through the service role, touches
it. The cap defaults to 10 per UTC day.

## Deploy

```bash
# Once: create the counter table and claim function.
# Paste usage-limit.sql into Dashboard → SQL Editor → New query.

supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set DAILY_RECOMMENDATION_LIMIT=10   # optional, defaults to 10
supabase functions deploy recommend-books
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase — don't
set them yourself, and don't add them to any `.env` that could reach the
front end.

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
{
  "recommendations": [{ "title": "...", "author": "...", "reason": "..." }],
  "remaining": 7
}
```

`remaining` is how many runs are left today after this one.

Errors return `{ "error": "..." }` with a 4xx/5xx status. `401` (signed out)
and `429` (daily cap) carry a message written for the reader and the UI shows
it verbatim; everything else is generic, since upstream errors can echo request
content. The real detail is logged server-side.

## Notes

- The response shape is enforced with `output_config.format` (a zod schema), so
  the model can't return prose or fenced JSON that needs unwrapping.
- The shelf is capped at 40 books before it goes into the prompt — enough to
  read someone's taste, without paying for a 300-book list.
- Titles and authors from the client are validated and length-capped before
  they're interpolated into the prompt.
- The slot is claimed after the shelf is validated but before the model call,
  so a malformed request costs nothing — but a run that fails afterwards still
  counts, because the expensive failure (a full response that wouldn't parse)
  has already spent the money.
