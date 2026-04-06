-- Create storage bucket for kill selfies
insert into storage.buckets (id, name, public)
values ('kill-selfies', 'kill-selfies', false);

-- Allow authenticated users to upload to their own folder
create policy "kill_selfies_upload" on storage.objects
  for insert
  with check (
    bucket_id = 'kill-selfies'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow all authenticated users to view kill selfies
create policy "kill_selfies_select" on storage.objects
  for select
  using (
    bucket_id = 'kill-selfies'
    and auth.role() = 'authenticated'
  );
