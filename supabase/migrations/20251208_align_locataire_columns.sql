-- S'assure que les colonnes liées aux locataires existent partout
alter table public.locataires_details
  add column if not exists phone text;

alter table public.tickets
  add column if not exists locataire_id uuid references public.locataires_details(id);

alter table public.missions
  add column if not exists locataire_id uuid references public.locataires_details(id);

-- Index pour accélérer les jointures locataires
create index if not exists idx_tickets_locataire_id on public.tickets(locataire_id);
create index if not exists idx_missions_locataire_id on public.missions(locataire_id);

-- Vérifie que toutes les missions connaissent leur locataire en se basant sur le ticket
update public.missions m
set locataire_id = t.locataire_id
from public.tickets t
where m.ticket_id = t.id
  and (m.locataire_id is null or m.locataire_id <> t.locataire_id);

-- Vérifie que tous les tickets rattachent le bon locataire en se basant sur user_id historique
update public.tickets t
set locataire_id = ld.id
from public.locataires_details ld
where t.locataire_id = ld.user_id
  and ld.id is not null
  and t.locataire_id <> ld.id;

-- Verrouille les valeurs à NOT NULL si aucune ligne n'est vide
do $$
begin
  if not exists (select 1 from public.tickets where locataire_id is null) then
    alter table public.tickets alter column locataire_id set not null;
  end if;

  if not exists (select 1 from public.missions where locataire_id is null) then
    alter table public.missions alter column locataire_id set not null;
  end if;
end $$;
