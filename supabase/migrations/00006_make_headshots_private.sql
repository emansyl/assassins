-- Make headshots bucket private
update storage.buckets set public = false where id = 'headshots';

-- Drop the old public select policy
drop policy if exists "headshots_public_select" on storage.objects;

-- Drop the old admin insert policy
drop policy if exists "headshots_admin_insert" on storage.objects;

-- Authenticated users can view headshots
create policy "headshots_authenticated_select" on storage.objects
  for select
  using (
    bucket_id = 'headshots'
    and auth.role() = 'authenticated'
  );
