-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Table: public.site_content (Simple Key-Value Store for text/images)
create table if not exists public.site_content (
  key text primary key,
  value text,
  section text, -- e.g. 'hero', 'contact'
  type text default 'text' -- 'text', 'image', 'textarea', 'metrics'
);

-- Table: public.site_sections (Repeatable content like feature cards, event types)
create table if not exists public.site_sections (
  id uuid default uuid_generate_v4() primary key,
  section_key text not null, -- e.g. 'structure_features', 'event_types', 'steps'
  title text,
  subtitle text,
  content text,
  image_url text,
  icon text, -- for material icons
  order_index integer default 0
);

-- Table: public.gallery_images
create table if not exists public.gallery_images (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  caption text,
  category text, -- 'wedding', 'birthday', 'corporate'
  order_index integer default 0
);

-- Table: public.testimonials
create table if not exists public.testimonials (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text,
  content text not null,
  image_url text,
  rating integer default 5,
  is_active boolean default true
);

-- RLS Policies (Allow public read, admin write)
alter table public.site_content enable row level security;
alter table public.site_sections enable row level security;
alter table public.gallery_images enable row level security;
alter table public.testimonials enable row level security;

-- Allow public read access (for the landing page)
create policy "Allow public read access on site_content" on public.site_content for select using (true);
create policy "Allow public read access on site_sections" on public.site_sections for select using (true);
create policy "Allow public read access on gallery_images" on public.gallery_images for select using (true);
create policy "Allow public read access on testimonials" on public.testimonials for select using (true);

-- Allow authenticated (admin) write access
-- Note: You need to set your Auth policies properly. Assuming any logged-in user is admin for now or checking role.
-- For now, allowing all authenticated users to modify (assuming only admin creates accounts via dashboard)
create policy "Allow auth update on site_content" on public.site_content for update using (auth.role() = 'authenticated');
create policy "Allow auth insert on site_sections" on public.site_sections for insert with check (auth.role() = 'authenticated');
create policy "Allow auth update on site_sections" on public.site_sections for update using (auth.role() = 'authenticated');
create policy "Allow auth delete on site_sections" on public.site_sections for delete using (auth.role() = 'authenticated');

create policy "Allow auth insert on gallery_images" on public.gallery_images for insert with check (auth.role() = 'authenticated');
create policy "Allow auth update on gallery_images" on public.gallery_images for update using (auth.role() = 'authenticated');
create policy "Allow auth delete on gallery_images" on public.gallery_images for delete using (auth.role() = 'authenticated');

create policy "Allow auth insert on testimonials" on public.testimonials for insert with check (auth.role() = 'authenticated');
create policy "Allow auth update on testimonials" on public.testimonials for update using (auth.role() = 'authenticated');
create policy "Allow auth delete on testimonials" on public.testimonials for delete using (auth.role() = 'authenticated');

-- Seed Data (Initial Values acting as defaults)
insert into public.site_content (key, value, section, type) values
('hero_title', 'Seu evento com clima rústico e moderno', 'hero', 'text'),
('hero_subtitle', 'O espaço ideal para casamentos e confraternizações inesquecíveis.', 'hero', 'textarea'),
('hero_bg_image', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 'hero', 'image'),
('contact_phone', '61996351010', 'contact', 'text'),
('contact_email', 'contato@quintaldafafa.com.br', 'contact', 'text'),
('footer_text', '© 2026 Quintal da Fafá. Todos os direitos reservados.', 'footer', 'text')
on conflict (key) do nothing;
