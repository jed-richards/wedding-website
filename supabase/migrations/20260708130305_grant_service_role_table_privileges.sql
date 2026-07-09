-- The original migration created these tables but never granted the service_role
-- Postgres role privileges on them, so the RSVP/admin server code (which uses the
-- service-role key and bypasses RLS) got "permission denied for table parties/guests"
-- on every write. RLS is still intentionally off; this only fixes plain GRANTs.
grant select, insert, update, delete on public.parties to service_role;
grant select, insert, update, delete on public.guests to service_role;
