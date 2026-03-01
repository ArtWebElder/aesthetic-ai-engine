-- Storage policies for frontend asset uploads used by EditorPage (subject/style/reference/social builder)
-- Bucket: project-assets (public)

insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do update set public = excluded.public;

-- Allow anonymous users to upload/update only inside refs/* and builder/*
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'anon upload project assets'
  ) then
    execute $p$
      create policy "anon upload project assets"
      on storage.objects for insert
      with check (
        bucket_id = 'project-assets'
        and auth.role() = 'anon'
        and (storage.foldername(name))[1] in ('refs', 'builder')
      );
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'anon update project assets'
  ) then
    execute $p$
      create policy "anon update project assets"
      on storage.objects for update
      using (
        bucket_id = 'project-assets'
        and auth.role() = 'anon'
        and (storage.foldername(name))[1] in ('refs', 'builder')
      )
      with check (
        bucket_id = 'project-assets'
        and auth.role() = 'anon'
        and (storage.foldername(name))[1] in ('refs', 'builder')
      );
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public read project assets'
  ) then
    execute $p$
      -- Public read for rendered URLs from /storage/v1/object/public/project-assets/*
      create policy "public read project assets"
      on storage.objects for select
      using (bucket_id = 'project-assets');
    $p$;
  end if;
end $$;
