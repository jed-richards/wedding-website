# Wedding Website

SvelteKit site deployed to Cloudflare Workers, backed by Supabase (Postgres). Built with
[`sv`](https://github.com/sveltejs/cli): Svelte 5, TypeScript, Tailwind v4,
`@sveltejs/adapter-cloudflare`.

## Useful links

- [Supabase dashboard](https://supabase.com/dashboard/project/embaqmcpelpqfrbsgxfi)
- [Cloudflare Workers dashboard](https://dash.cloudflare.com/8593014c2a1be8c627b4391c599232e2/workers/services/view/wedding-website/production)
- [Production site](https://kenadieandjed.com/)

## Prerequisites

- [pnpm](https://pnpm.io/)
- [Docker](https://docs.docker.com/get-docker/) — only needed for local Supabase
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

```sh
pnpm install
```

## Local development

By default `pnpm dev` talks to a **local, disposable** Supabase stack, not production — so
schema experiments and test data can't touch real guest data.

1. Copy `.env.example` to `.env` and fill in the **production** Supabase URL/keys. This
   file is what `wrangler` reads for typegen and for deploys/`wrangler secret put`; it is
   not what `pnpm dev` uses for Supabase access (see next step).
2. Start the local stack (needs Docker running):
   ```sh
   supabase start
   ```
   This spins up Postgres/PostgREST/GoTrue/Studio via a Docker Compose stack the CLI
   manages for you, and applies every migration in `supabase/migrations/` automatically.
   The command prints a local project URL and keys — Studio is at
   `http://127.0.0.1:54323`.
3. Create two gitignored files with those local values, overriding `.env` for `pnpm dev`
   only:
   - `.env.local` — `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (read by
     Vite for `$env/static/public`). No example file since it's just two public values —
     copy them straight from the `supabase start` output.
   - `.dev.vars` — copy `.dev.vars.example` to `.dev.vars` and fill in
     `SUPABASE_SERVICE_ROLE_KEY` from `supabase start` (wrangler's local platform proxy
     reads this before falling back to `.env`).
4. Start the dev server:
   ```sh
   pnpm run dev
   ```
   Every request is logged (method, path, status, timing) via morgan.

Stop the local stack with `supabase stop` when you're done. To see container logs:

```sh
docker compose -p supabase_wedding-website logs -f
```

## Environment variables

- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public, safe to expose to the
  browser.
- `SUPABASE_SERVICE_ROLE_KEY` — **secret**, server-only. From the Supabase dashboard:
  Project Settings > API > service_role secret. Used to read/write `parties`/`guests`/
  `admin_users` from `/rsvp` and `/admin` server code, bypassing RLS. Never import this
  from a `.svelte` file or anywhere the browser can reach.

After changing `.env`, run `pnpm run typegen` to regenerate `worker-configuration.d.ts` so
the new vars are typed on `Env`.

For production, set the secret with `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` —
don't rely on `wrangler.jsonc` vars for it.

> Note: the anon/publishable key must never be granted table access to `parties` or
> `guests` (RLS is currently off on those tables specifically because only the
> service-role key touches them, server-side).

## Admin access (`/admin`)

`/admin` uses Supabase Auth's Google sign-in instead of a shared password. Access is
controlled two ways:

1. **Supabase Auth > Providers > Google** must be enabled in the
   [Supabase dashboard](https://supabase.com/dashboard/project/embaqmcpelpqfrbsgxfi),
   with a Google OAuth client ID/secret from the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`).
   This is dashboard/console configuration, not something in this repo.
2. The signed-in Google account's email must exist in the `admin_users` table
   (see `supabase/migrations/20260710120000_create_admin_users.sql`). Add or remove admins
   by editing that table directly in the Supabase dashboard's SQL editor or Table editor —
   no redeploy needed:
   ```sql
   insert into admin_users (email) values ('someone@gmail.com');
   delete from admin_users where email = 'someone@gmail.com';
   ```

Signing in with a Google account that isn't in `admin_users` immediately signs the account
back out and shows a "not authorized" message on `/admin`.

To test Google sign-in against the **local** Supabase stack, configure
`[auth.external.google]` in `supabase/config.toml` with a Google OAuth client registered
for `http://127.0.0.1:54321/auth/v1/callback`, and set
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`/`SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` before
running `supabase start`. Otherwise, just test against production/staging Supabase.

## Building

```sh
pnpm run build   # production build
pnpm run preview # preview the production build locally
pnpm run check   # type-check
pnpm run lint    # eslint + prettier check
```
