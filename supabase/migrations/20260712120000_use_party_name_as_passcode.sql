-- Guests now RSVP with their party name instead of a separate passcode.
alter table parties drop column passcode;

-- Party names are the RSVP lookup key now, so they must be unique
-- (case-insensitive) to avoid one name resolving to multiple parties.
create unique index idx_parties_party_name_lower on parties (lower(party_name));
