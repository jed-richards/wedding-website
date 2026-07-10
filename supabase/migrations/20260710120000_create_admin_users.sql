-- Allowlist of Google accounts permitted to sign in to /admin. Supabase Auth
-- verifies the Google sign-in; server code then checks the signed-in email
-- against this table before granting access. RLS is intentionally left off,
-- same as parties/guests: only the service-role key (server-side) touches it.
create table admin_users (
    email text primary key,
    created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.admin_users to service_role;

-- Seed the initial admin. Add the rest (Kennedy, etc.) via the Supabase dashboard
-- SQL editor: insert into admin_users (email) values ('someone@gmail.com');
insert into admin_users (email) values ('jed22richards@gmail.com');
