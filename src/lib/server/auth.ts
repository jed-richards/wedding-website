/** Shared helpers for the /admin Google sign-in gate. Access is granted per Google
 * account: Supabase Auth verifies the Google sign-in, then we check the signed-in
 * email against the `admin_users` allowlist table before treating the request as
 * authenticated. */

import type { Cookies } from "@sveltejs/kit";
import { createAuthClient, createServiceClient } from "./supabase";

type AdminSession =
  | { status: "authed"; email: string }
  | { status: "not_authorized" }
  | { status: "signed_out" };

async function isAllowedEmail(env: Env, email: string) {
  const supabase = createServiceClient(env);
  const { data } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data !== null;
}

/** Resolves the current /admin session from the Supabase Auth cookie. A Google
 * account that isn't on the `admin_users` allowlist is reported as
 * "not_authorized" (and signed back out), distinct from never having signed in
 * at all, so the UI can explain why access was denied. */
export async function getAdminSession(
  cookies: Cookies,
  env: Env,
): Promise<AdminSession> {
  const supabaseAuth = createAuthClient(cookies);
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user?.email) return { status: "signed_out" };

  if (!(await isAllowedEmail(env, user.email))) {
    await supabaseAuth.auth.signOut();
    return { status: "not_authorized" };
  }

  return { status: "authed", email: user.email };
}

/** Returns the signed-in admin's email, or null if they're not authenticated —
 * for the form actions that just need to gate a write, not explain why. */
export async function requireAdminEmail(cookies: Cookies, env: Env) {
  const session = await getAdminSession(cookies, env);
  return session.status === "authed" ? session.email : null;
}
