import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";

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
