# Wedding Website

SvelteKit site deployed to Cloudflare Workers, backed by Supabase (Postgres). Built with
[`sv`](https://github.com/sveltejs/cli): Svelte 5, TypeScript, Tailwind v4,
`@sveltejs/adapter-cloudflare`.

## Useful links

- [Supabase dashboard](https://supabase.com/dashboard/project/embaqmcpelpqfrbsgxfi)
- [Cloudflare Workers dashboard](https://dash.cloudflare.com/8593014c2a1be8c627b4391c599232e2/workers/services/view/wedding-website/production)
- [Production site](https://wedding-website.jed22richards.workers.dev/)

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
     reads this before falling back to `.env`). Set `ADMIN_PASSWORD` to whatever you want
     locally.
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
  Project Settings > API > service_role secret. Used to read/write `parties`/`guests` from
  `/rsvp` and `/admin` server code, bypassing RLS. Never import this from a `.svelte` file
  or anywhere the browser can reach.
- `ADMIN_PASSWORD` — **secret**, the shared password for `/admin`.

After changing `.env`, run `pnpm run typegen` to regenerate `worker-configuration.d.ts` so
the new vars are typed on `Env`.

For production, set the two secrets with `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
and `wrangler secret put ADMIN_PASSWORD` — don't rely on `wrangler.jsonc` vars for these.

> Note: the anon/publishable key must never be granted table access to `parties` or
> `guests` (RLS is currently off on those tables specifically because only the
> service-role key touches them, server-side).

## Building

```sh
pnpm run build   # production build
pnpm run preview # preview the production build locally
pnpm run check   # type-check
pnpm run lint    # eslint + prettier check
```
