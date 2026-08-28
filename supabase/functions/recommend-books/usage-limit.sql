-- Per-user daily cap for "Recommend my next read".
--
-- The anon key that reaches the recommend-books function is the one shipped in
-- the bundle, so "a request arrived" says nothing about who sent it — and every
-- request spends real money at Anthropic. The function checks for a signed-in
-- user and claims a slot from this table before it prompts the model.
--
-- Nightstand has no migrations directory: run this once in the Supabase SQL
-- editor (Dashboard → SQL Editor → New query). It is safe to re-run.

create table if not exists public.rec_usage (
    user_id uuid not null references auth.users (id) on delete cascade,
    day date not null,
    count integer not null default 0,
    primary key (user_id, day)
);

-- RLS on with zero policies denies every anon and authenticated request. That
-- is the whole point: a user can't read their own counter and — the part that
-- matters — can't reset it. Only the definer function below and the service
-- role reach this table.
alter table public.rec_usage enable row level security;

/*
 * Claims one recommendation for today, atomically.
 *
 * Returns how many runs are left after this one, or -1 when the user was
 * already at the cap. Reading the count and then writing it would let two
 * rapid clicks both pass the check before either wrote; this is a single
 * statement, so concurrent calls serialise on the row lock instead.
 *
 * The WHERE on DO UPDATE is what enforces the cap. When it fails, the update
 * doesn't happen, RETURNING yields no row, and v_count stays null.
 *
 * The day boundary is UTC rather than the reader's timezone — the browser's
 * offset isn't trustworthy input for a spend limit, and a cap that shifts with
 * a claimed timezone can be dodged by claiming a different one.
 */
create or replace function public.claim_recommendation(p_user_id uuid, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count integer;
begin
    -- A misconfigured limit should stop the spend, not wave it through: the
    -- first insert of the day has no conflict to filter, so a limit below 1
    -- has to be caught here.
    if p_limit is null or p_limit < 1 then
        return -1;
    end if;

    insert into public.rec_usage (user_id, day, count)
    values (p_user_id, (now() at time zone 'utc')::date, 1)
    on conflict (user_id, day) do update
        set count = rec_usage.count + 1
        where rec_usage.count < p_limit
    returning count into v_count;

    if v_count is null then
        return -1;
    end if;

    return p_limit - v_count;
end;
$$;

-- p_limit is a parameter, so anyone who can execute this can name their own
-- cap. Only the service role — which exists solely inside the edge function —
-- is allowed to call it.
revoke all on function public.claim_recommendation(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_recommendation(uuid, integer) to service_role;

-- Rows are one per user per day and never read back, so they are only clutter
-- once the day has passed. Nothing deletes them automatically; run this
-- occasionally if the table ever gets big enough to notice:
--
--   delete from public.rec_usage where day < current_date - interval '30 days';
