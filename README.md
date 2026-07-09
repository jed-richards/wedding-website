## Useful

- https://supabase.com/dashboard/project/embaqmcpelpqfrbsgxfi
- https://dash.cloudflare.com/8593014c2a1be8c627b4391c599232e2/workers/services/view/wedding-website/production
- https://wedding-website.jed22richards.workers.dev/

## Environment variables

Copy `.env.example` to `.env` and fill in:

- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public, safe to expose to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` — **secret**, server-only. From the Supabase dashboard:
  Project Settings > API > service_role secret. Used to read/write `parties`/`guests`
  from `/rsvp` and `/admin` server code, bypassing RLS. Never import this from a
  `.svelte` file or anywhere the browser can reach.
- `ADMIN_PASSWORD` — **secret**, the shared password for `/admin`.

After changing `.env`, run `pnpm run typegen` to regenerate `worker-configuration.d.ts`
so the new vars are typed on `Env`.

For production, set the two secrets with `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
and `wrangler secret put ADMIN_PASSWORD` — don't rely on `wrangler.jsonc` vars for these.

> Note: the anon/publishable key must never be granted table access to `parties` or
> `guests` (RLS is currently off on those tables specifically because only the
> service-role key touches them, server-side).

---

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.16.2 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:cloudflare+cfTarget:workers" --install pnpm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
