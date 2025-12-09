-- Backfill les techniciens existants dans la nouvelle table entreprise_techniciens
-- Cette migration garantit que la vue Entreprise récupère bien tous les techniciens

with techniciens as (
  select
    p.id as profile_id,
    p.entreprise_id,
    p.phone,
    coalesce(p.is_active, true) as is_active,
    au.email
  from public.profiles p
  join auth.users au on au.id = p.id
  where p.role = 'technicien'
    and p.entreprise_id is not null
)
insert into public.entreprise_techniciens (
  profile_id,
  entreprise_id,
  telephone,
  email,
  statut,
  is_active,
  created_at,
  updated_at
)
select
  t.profile_id,
  t.entreprise_id,
  t.phone,
  t.email,
  'disponible',
  t.is_active,
  now(),
  now()
from techniciens t
where not exists (
  select 1
  from public.entreprise_techniciens et
  where et.profile_id = t.profile_id
);

-- Harmonise les lignes déjà présentes mais sans entreprise associée ou avec des champs vides
update public.entreprise_techniciens et
set
  entreprise_id = coalesce(et.entreprise_id, p.entreprise_id),
  telephone = coalesce(et.telephone, p.phone),
  email = coalesce(et.email, au.email),
  is_active = coalesce(et.is_active, p.is_active, true),
  updated_at = now()
from public.profiles p
join auth.users au on au.id = p.id
where et.profile_id = p.id
  and p.role = 'technicien'
  and p.entreprise_id is not null;
