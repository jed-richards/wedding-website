import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} from "$env/static/public";
import type { Cookies } from "@sveltejs/kit";

/**
 * Service-role Supabase client for trusted server-side code only (form actions,
 * +server.ts endpoints). Bypasses RLS, so it must never be reachable from the
 * browser and must never be imported from a `.svelte` file.
 */
export function createServiceClient(env: Env) {
  return createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Anon-key Supabase client scoped to the current request's cookies, used only for
 * the /admin Google sign-in flow (signInWithOAuth, exchangeCodeForSession,
 * signOut, getUser). Cookies are scoped to /admin, matching the old admin session
 * cookie, since nothing outside /admin needs a Supabase Auth session.
 */
export function createAuthClient(cookies: Cookies) {
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, { ...options, path: "/admin" });
        }
      },
    },
  });
}
