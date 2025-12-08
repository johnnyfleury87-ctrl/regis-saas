-- Ajoute regie_id et locataire_id aux missions si absents
alter table public.missions
  add column if not exists regie_id uuid references public.regie(id);

alter table public.missions
  add column if not exists locataire_id uuid references public.locataires_details(id);

-- Renseigne les colonnes à partir des tickets existants
update public.missions m
set regie_id = t.regie_id
from public.tickets t
where m.ticket_id = t.id
  and (m.regie_id is null or m.regie_id <> t.regie_id);

update public.missions m
set locataire_id = t.locataire_id
from public.tickets t
where m.ticket_id = t.id
  and (m.locataire_id is null or m.locataire_id <> t.locataire_id);

-- Contraintes NOT NULL uniquement si toutes les lignes sont renseignées
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'missions'
      and column_name = 'regie_id'
  ) then
    if not exists (select 1 from public.missions where regie_id is null) then
      alter table public.missions alter column regie_id set not null;
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'missions'
      and column_name = 'locataire_id'
  ) then
    if not exists (select 1 from public.missions where locataire_id is null) then
      alter table public.missions alter column locataire_id set not null;
    end if;
  end if;
end $$;
