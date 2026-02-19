-- FIX: Allow INSERT policy for site_content to enable UPSERT operations
-- The upsert command requires both UPDATE and INSERT permissions.

-- Drop existing policies to be safe and avoid conflicts
drop policy if exists "Allow auth update on site_content" on public.site_content;

-- Re-create Update Policy
create policy "Allow auth update on site_content" 
on public.site_content 
for update 
using (auth.role() = 'authenticated');

-- Create Insert Policy (Missing previously)
create policy "Allow auth insert on site_content" 
on public.site_content 
for insert 
with check (auth.role() = 'authenticated');
