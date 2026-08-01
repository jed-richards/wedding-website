-- Party size is currently implicit (the count of a party's guest rows), so
-- there's no way to give a party an unnamed plus-one seat. Add an explicit
-- max_party_size on parties; the number of open plus-one slots a guest can
-- fill in at RSVP time is derived as max_party_size minus the number of named
-- (is_plus_one = false) guests already on the party.
alter table parties
    add column max_party_size int not null default 1;

-- Backfill existing parties to their current named-guest count so nobody
-- gets extra open slots retroactively.
update parties p
set max_party_size = greatest(1, (
    select count(*) from guests g where g.party_id = p.id
));

-- Guests a party adds themselves at RSVP time (vs. admin-imported "named"
-- guests) are flagged so we know which rows are guest-owned and safe to
-- wholesale replace on resubmit.
alter table guests
    add column is_plus_one boolean not null default false;

-- Plus-ones only require a first name (last name is optional), unlike
-- admin-imported named guests.
alter table guests
    alter column last_name drop not null;
