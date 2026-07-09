/** Shared helpers for the /admin password gate. Not a general-purpose auth system —
 * there's a single shared admin password, no per-user accounts. */

const ADMIN_SESSION_COOKIE = "admin_session";

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic token derived from the admin password, so we don't need a sessions
 * table: anyone who can compute this already knows the password. */
async function adminSessionToken(env: Env) {
  return sha256Hex(`${env.ADMIN_PASSWORD}:admin-session`);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyAdminPassword(env: Env, password: string) {
  return timingSafeEqual(password, env.ADMIN_PASSWORD);
}

export async function setAdminSession(
  cookies: import("@sveltejs/kit").Cookies,
  env: Env,
) {
  cookies.set(ADMIN_SESSION_COOKIE, await adminSessionToken(env), {
    path: "/admin",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAdminSession(cookies: import("@sveltejs/kit").Cookies) {
  cookies.delete(ADMIN_SESSION_COOKIE, { path: "/admin" });
}

export async function isAdmin(cookies: import("@sveltejs/kit").Cookies, env: Env) {
  const cookie = cookies.get(ADMIN_SESSION_COOKIE);
  if (!cookie) return false;
  return timingSafeEqual(cookie, await adminSessionToken(env));
}
