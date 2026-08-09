-- Optional contact number so we can text day-of/day-before details (park
-- entry, parking) to parties who opt in. Nullable, no format constraint —
-- normalization to E.164 happens in app code (src/lib/server/phone.ts)
-- before it ever reaches the database, matching how party_name/display_name
-- are validated in application code rather than via CHECK constraints.
alter table parties add column phone text;
