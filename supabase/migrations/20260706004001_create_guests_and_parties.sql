-- RLS is intentionally left off for now. The RSVP passcode check will run
-- server-side with a service-role key when the RSVP endpoints are built,
-- so anon-key access doesn't need policies yet.

create table parties (
    id uuid primary key default gen_random_uuid(),
    party_name text not null,
    passcode text not null,
    created_at timestamptz not null default now()
);

create table guests (
    id uuid primary key default gen_random_uuid(),
    party_id uuid not null references parties (id) on delete cascade,
    first_name text not null,
    last_name text not null,
    is_attending boolean,
    meal_choice text,
    dietary_notes text,
    updated_at timestamptz not null default now()
);

create index idx_guests_names on guests (last_name, first_name);
