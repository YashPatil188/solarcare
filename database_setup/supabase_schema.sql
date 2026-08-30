-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- CUSTOMERS MASTER TABLE (Managed by Admin)
create table public.customers_master (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text unique not null,
  phone text,
  address text,
  system_capacity_kw numeric not null,
  installation_date date not null,
  amc_status text check (amc_status in ('active', 'expired')) default 'active',
  amc_valid_until date,
  created_at timestamp with time zone default now()
);

-- PROFILES TABLE
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  phone text,
  role text check (role in ('customer', 'admin', 'technician')) default 'customer',
  address text,
  created_at timestamp with time zone default now()
);

-- SOLAR SYSTEMS TABLE
create table public.solar_systems (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  capacity_kw numeric not null,
  installation_date date not null,
  amc_status text check (amc_status in ('active', 'expired')) default 'active',
  amc_valid_until date,
  created_at timestamp with time zone default now()
);

-- TICKETS TABLE
create table public.tickets (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  system_id uuid references public.solar_systems(id) on delete set null,
  issue_type text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  status text check (status in ('raised', 'assigned', 'in_progress', 'completed', 'closed')) default 'raised',
  assigned_technician_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- TICKET UPDATES TABLE
create table public.ticket_updates (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  technician_id uuid references public.profiles(id) on delete set null,
  status_change text, -- e.g., 'in_progress'
  remarks text,
  photo_url text,
  created_at timestamp with time zone default now()
);

-- NOTIFICATIONS TABLE
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- ENABLE ROW LEVEL SECURITY
alter table public.customers_master enable row level security;
alter table public.profiles enable row level security;
alter table public.solar_systems enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_updates enable row level security;
alter table public.notifications enable row level security;

-- POLICIES

-- Customers Master:
-- Only Admins can view/edit.
create policy "Admins manage customers master"
on public.customers_master for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Profiles: 
create policy "Public profiles are viewable by everyone" 
on public.profiles for select using (true);

create policy "Users can update own profile" 
on public.profiles for update using (auth.uid() = id);

-- Solar Systems:
create policy "Customers view own systems" 
on public.solar_systems for select using (auth.uid() = customer_id);

create policy "Admins and Technicians view all systems"
on public.solar_systems for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'technician'))
);

-- Tickets:
create policy "Customers view own tickets" 
on public.tickets for select using (auth.uid() = customer_id);

create policy "Admins view all tickets" 
on public.tickets for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Technicians view assigned tickets" 
on public.tickets for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'technician')
  and (assigned_technician_id is null or assigned_technician_id = auth.uid())
);

create policy "Customers create tickets" 
on public.tickets for insert with check (auth.uid() = customer_id);

create policy "Admins update tickets" 
on public.tickets for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Technicians update assigned tickets" 
on public.tickets for update using (
  auth.uid() = assigned_technician_id
);

-- Ticket Updates:
create policy "View ticket updates" 
on public.ticket_updates for select using (
  exists (
    select 1 from public.tickets t 
    where t.id = ticket_id 
    and (t.customer_id = auth.uid() or t.assigned_technician_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

create policy "Technicians create updates" 
on public.ticket_updates for insert with check (
  auth.uid() = technician_id
);

-- AUTOMATION & CONTROLLED ONBOARDING TRIGGER

create or replace function public.handle_new_user() 
returns trigger as $$
declare
  master_record public.customers_master%rowtype;
begin
  -- Check if email exists in customers_master
  select * into master_record from public.customers_master where email = new.email;
  
  if found then
    -- 1. Create Profile (Auto-filled from Master)
    insert into public.profiles (id, name, phone, address, role)
    values (new.id, master_record.name, master_record.phone, master_record.address, 'customer');

    -- 2. Create Solar System (Auto-filled from Master)
    insert into public.solar_systems (customer_id, capacity_kw, installation_date, amc_status, amc_valid_until)
    values (new.id, master_record.system_capacity_kw, master_record.installation_date, master_record.amc_status, master_record.amc_valid_until);

  else
    -- If not in master list, check if meant to be admin/tech (manually inserted via SQL or dashboard usually)
    -- For now, we REJECT if not in master list and no role metadata provided (standard signup)
    if new.raw_user_meta_data->>'role' is null or new.raw_user_meta_data->>'role' = 'customer' then
       raise exception 'Email not found in customer records. Please contact support.';
    else
       -- Allow Admin/Technician creation if role is explicitly passed (e.g. from Admin inviting user)
       insert into public.profiles (id, name, role)
       values (new.id, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'customer'));
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
