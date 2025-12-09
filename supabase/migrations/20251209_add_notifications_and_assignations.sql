-- Ajout des tables nécessaires aux notifications locataires
-- et à l'assignation des missions aux techniciens

create table if not exists public.locataire_notifications (
  id uuid not null default gen_random_uuid(),
  locataire_id uuid not null references public.locataires_details(id),
  ticket_id uuid null references public.tickets(id),
  mission_id uuid null references public.missions(id),
  type text not null default 'information',
  title text null,
  message text not null,
  channel text not null default 'in_app',
  payload jsonb null,
  delivery_status text null default 'pending',
  sent_at timestamp with time zone null,
  read_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint locataire_notifications_pkey primary key (id)
);

create index if not exists locataire_notifications_locataire_id_idx
  on public.locataire_notifications(locataire_id);

create index if not exists locataire_notifications_mission_id_idx
  on public.locataire_notifications(mission_id);

create table if not exists public.missions_assignations (
  id uuid not null default gen_random_uuid(),
  mission_id uuid not null references public.missions(id),
  technicien_id uuid not null references public.profiles(id),
  entreprise_technicien_id uuid null references public.entreprise_techniciens(id),
  assigner_id uuid null references public.profiles(id),
  statut text null default 'assignée',
  is_active boolean not null default true,
  notes text null,
  assigned_at timestamp with time zone not null default now(),
  acknowledged_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  rapport_payload jsonb null,
  rapport_signature_url text null,
  constraint missions_assignations_pkey primary key (id),
  constraint missions_assignations_unique unique (mission_id, technicien_id)
);

create index if not exists missions_assignations_mission_id_idx
  on public.missions_assignations(mission_id);

create index if not exists missions_assignations_technicien_id_idx
  on public.missions_assignations(technicien_id);

alter table public.locataire_notifications enable row level security;
alter table public.missions_assignations enable row level security;
