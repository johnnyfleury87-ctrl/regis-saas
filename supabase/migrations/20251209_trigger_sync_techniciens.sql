create unique index if not exists entreprise_techniciens_profile_id_idx
  on public.entreprise_techniciens(profile_id);

create or replace function public.sync_technicien_to_entreprise()
returns trigger as $$
declare
  tech_email text;
begin
  -- Ne traiter que les profils technicien rattachés à une entreprise
  if (new.role = 'technicien' and new.entreprise_id is not null) then
    select email into tech_email from auth.users where id = new.id;

    -- Upsert dans entreprise_techniciens
    insert into public.entreprise_techniciens (
      profile_id,
      entreprise_id,
      telephone,
      email,
      statut,
      is_active
    )
    values (
      new.id,
      new.entreprise_id,
      new.phone,
      tech_email,
      'disponible',
      coalesce(new.is_active, true)
    )
    on conflict (profile_id) do update set
      entreprise_id = excluded.entreprise_id,
      telephone = excluded.telephone,
      email = excluded.email,
      is_active = excluded.is_active,
      updated_at = now();
  elsif (new.role = 'technicien' and new.entreprise_id is null) then
    -- Si on retire l'entreprise du profil, on désactive la ligne associée
    update public.entreprise_techniciens
      set is_active = false,
          updated_at = now()
    where profile_id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.delete_technicien_cleanup()
returns trigger as $$
begin
  -- Supprimer la ligne entreprise_techniciens reliée au profil supprimé
  delete from public.entreprise_techniciens where profile_id = old.id;
  return old;
end;
$$ language plpgsql security definer;

-- Trigger sur insertion / mise à jour de profiles
create trigger trg_profiles_sync_technicien
  after insert or update on public.profiles
  for each row
  execute function public.sync_technicien_to_entreprise();

-- Trigger sur suppression de profiles
create trigger trg_profiles_delete_technicien
  after delete on public.profiles
  for each row
  execute function public.delete_technicien_cleanup();
