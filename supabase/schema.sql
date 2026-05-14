-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Circles
create table circles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  logo_url text,
  contact_email text not null,
  category text not null default 'other' check (category in ('sports','culture','academic','music','outdoor','food','incircle','other')),
  university text,
  member_count integer,
  admission_fee integer,
  annual_fee integer,
  activity_frequency text,
  gender_ratio text,
  genre text,
  twitter_url text,
  instagram_url text,
  youtube_url text,
  line_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Circle admins (many-to-many: auth.users <-> circles)
create table circle_admins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  circle_id uuid not null references circles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, circle_id)
);

-- Events
create table events (
  id uuid primary key default uuid_generate_v4(),
  circle_id uuid not null references circles(id) on delete cascade,
  title text not null,
  description text,
  date timestamptz not null,
  location text,
  capacity integer not null default 20,
  reserved_count integer not null default 0,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reservations
create table reservations (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text not null,
  grade text not null,
  department text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index on events(circle_id);
create index on events(status);
create index on reservations(event_id);
create index on reservations(email);
create index on circle_admins(user_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_circles
  before update on circles
  for each row execute function set_updated_at();

create trigger set_updated_at_events
  before update on events
  for each row execute function set_updated_at();

create trigger set_updated_at_reservations
  before update on reservations
  for each row execute function set_updated_at();

-- Increment/decrement reserved_count automatically
create or replace function update_reserved_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update events set reserved_count = reserved_count + 1 where id = NEW.event_id;
  elsif TG_OP = 'DELETE' then
    update events set reserved_count = reserved_count - 1 where id = OLD.event_id;
  end if;
  return null;
end;
$$;

create trigger reservation_count_insert
  after insert on reservations
  for each row execute function update_reserved_count();

create trigger reservation_count_delete
  after delete on reservations
  for each row execute function update_reserved_count();

-- RLS
alter table circles enable row level security;
alter table circle_admins enable row level security;
alter table events enable row level security;
alter table reservations enable row level security;

-- circles: anyone can read; admins of that circle can write
create policy "circles_read_public" on circles
  for select using (true);

create policy "circles_write_admin" on circles
  for all using (
    exists (
      select 1 from circle_admins
      where circle_admins.circle_id = circles.id
        and circle_admins.user_id = auth.uid()
    )
  );

-- circle_admins: only own rows
create policy "circle_admins_own" on circle_admins
  for all using (user_id = auth.uid());

-- events: anyone can read open; admins of that circle can write
create policy "events_read_public" on events
  for select using (true);

create policy "events_write_admin" on events
  for all using (
    exists (
      select 1 from circle_admins
      where circle_admins.circle_id = events.circle_id
        and circle_admins.user_id = auth.uid()
    )
  );

-- reservations: admins of the event's circle can read/update; insert is open (via service role or anon)
create policy "reservations_read_admin" on reservations
  for select using (
    exists (
      select 1 from events
      join circle_admins on circle_admins.circle_id = events.circle_id
      where events.id = reservations.event_id
        and circle_admins.user_id = auth.uid()
    )
  );

create policy "reservations_update_admin" on reservations
  for update using (
    exists (
      select 1 from events
      join circle_admins on circle_admins.circle_id = events.circle_id
      where events.id = reservations.event_id
        and circle_admins.user_id = auth.uid()
    )
  );

-- Insert is done server-side via service role key (no anon insert policy needed)
