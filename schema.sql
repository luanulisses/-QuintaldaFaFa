-- Create tables for Quintal da Fafá

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: public.profiles (to store additional user info)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text default 'user',
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Table: public.leads
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  contact text, -- email or phone
  status text check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')) default 'new',
  source text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.events
create table if not exists public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  type text check (type in ('birthday', 'wedding', 'corporate', 'other')) default 'other',
  status text check (status in ('pending', 'confirmed', 'completed', 'cancelled')) default 'pending',
  client_id uuid references public.leads(id), -- optional link to a lead
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.financial
create table if not exists public.financial (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('income', 'expense')) not null,
  amount numeric not null,
  description text not null,
  date date not null,
  status text check (status in ('pending', 'paid', 'overdue')) default 'pending',
  event_id uuid references public.events(id), -- optional link to an event
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- For now, we'll enable RLS but allow public access for development purposes if needed.
-- Ideally, you should restrict this to authenticated users only.

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.events enable row level security;
alter table public.financial enable row level security;

-- Policies (Development: Allow all access for now to anon key for simplicity in prototype)
-- WARNING: In production, change this to restrict access!

create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Allow anon read/write for protocol (adjust as needed for real prod)
create policy "Enable read access for all users" on public.leads for select using (true);
create policy "Enable insert access for all users" on public.leads for insert with check (true);
create policy "Enable update access for all users" on public.leads for update using (true);

create policy "Enable read access for all users" on public.events for select using (true);
create policy "Enable insert access for all users" on public.events for insert with check (true);
create policy "Enable update access for all users" on public.events for update using (true);

create policy "Enable read access for all users" on public.financial for select using (true);
create policy "Enable insert access for all users" on public.financial for insert with check (true);
create policy "Enable update access for all users" on public.financial for update using (true);
