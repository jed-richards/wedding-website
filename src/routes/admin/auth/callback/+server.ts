import { redirect } from "@sveltejs/kit";
import { createAuthClient } from "$lib/server/supabase";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get("code");
  if (code) {
    const supabaseAuth = createAuthClient(cookies);
    await supabaseAuth.auth.exchangeCodeForSession(code);
  }

  throw redirect(303, "/admin");
};
