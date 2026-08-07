-- Per-guest rows bought us almost nothing (catering is all-you-can-eat pancakes,
-- no meal choice, no seating chart) and cost a lot: open plus-one slots were a
-- derived quantity, plus-one rows were wholesale deleted/reinserted on every
-- RSVP resubmit, and max_party_size couldn't shrink below a count living in
-- another table. Collapse everything onto parties: a human-readable
-- display_name (separate from party_name, which stays the RSVP lookup key),
-- an explicit plus_ones count, a headcount RSVP (attending_count), and
-- party-level dietary notes. No RSVPs have come in yet, so guests is dropped
-- outright rather than migrated.

alter table parties
    add column display_name text,
    add column plus_ones int not null default 0,
    add column attending_count int,
    add column dietary_notes text,
    add column updated_at timestamptz not null default now();

-- Backfill display_name for any existing rows, then make it required.
update parties set display_name = party_name where display_name is null;
alter table parties alter column display_name set not null;

alter table parties
    add constraint parties_max_party_size_range check (max_party_size between 1 and 20),
    add constraint parties_plus_ones_range
        check (plus_ones between 0 and max_party_size),
    add constraint parties_attending_count_range
        check (attending_count between 0 and max_party_size);

drop table guests;
