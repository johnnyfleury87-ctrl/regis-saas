-- 1. Table: regie
create table public.regie (
  id uuid not null default gen_random_uuid(),
  name text null,
  contact_email text null,
  contact_phone text null,
  address text null,
  created_at timestamp with time zone not null default now(),
  constraint regie_pkey primary key (id)
);

-- 2. Table: entreprises
create table public.entreprises (
  id uuid not null default gen_random_uuid(),
  regie_id uuid null references public.regie(id),
  name text not null,
  contact_email text null,
  contact_phone text null,
  address text null,
  ville text null,
  npa text null,
  created_at timestamp with time zone null default now(),
  constraint entreprises_pkey primary key (id)
);

-- 3. Table: profiles
-- Note: L'ID référence souvent auth.users dans Supabase
create table public.profiles (
  id uuid not null references auth.users(id),
  role text not null,
  regie_id uuid null references public.regie(id),
  entreprise_id uuid null references public.entreprises(id),
  display_name text null,
  phone text null,
  is_active boolean null default true,
  created_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id)
);

-- 4. Table: locataires_details
create table public.locataires_details (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  regie_id uuid null references public.regie(id),
  prenom text null,
  nom text null,
  email text null,
  phone text null,
  address text null,
  zip_code text null,
  city text null,
  building_code text null,
  apartment text null,
  loyer numeric null,
  created_at timestamp without time zone null default now(),
  constraint locataires_details_pkey primary key (id)
);

-- 5. Table: tickets
create table public.tickets (
  id uuid not null default gen_random_uuid(),
  locataire_id uuid null references public.locataires_details(id),
  regie_id uuid null references public.regie(id),
  entreprise_id uuid null references public.entreprises(id),
  technicien_id uuid null references public.profiles(id), -- Ou auth.users selon ta logique
  categorie text null,
  piece text null,
  detail text null,
  description text null,
  urgence integer null default 0,
  adresse text null,
  ville text null,
  dispo1 text null,
  dispo2 text null,
  dispo3 text null,
  statut text null default 'en_attente'::text,
  priorite text null,
  budget_plafond numeric null,
  photos text null, -- Peut stocker des URL ou du JSON stringifié
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint tickets_pkey primary key (id)
);

-- 6. Table: missions
create table public.missions (
  id uuid not null default gen_random_uuid(),
  ticket_id uuid null references public.tickets(id),
  entreprise_id uuid null references public.entreprises(id),
  technicien_id uuid null references public.profiles(id),
  regie_id uuid null references public.regie(id),
  statut text null default 'en_attente'::text,
  date_acceptation timestamp without time zone null,
  date_intervention timestamp without time zone null,
  date_fin timestamp without time zone null,
  commentaire text null,
  created_at timestamp without time zone null default now(),
  planifie_par uuid null references public.profiles(id),
  date_planifiee timestamp with time zone null,
  ordre_mission_url text null,
  ordre_mission_payload jsonb null,
  statut_intervention text null,
  commentaire_interne text null,
  locataire_id uuid null references public.locataires_details(id),
  constraint missions_pkey primary key (id)
);

create table public.entreprise_techniciens (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  entreprise_id uuid not null references public.entreprises(id),
  poste text null,
  competences text[] null,
  telephone text null,
  email text null,
  statut text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint entreprise_techniciens_pkey primary key (id)
);

create table public.materiel_categories (
  id uuid not null default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id),
  nom text not null,
  description text null,
  ordre integer null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint materiel_categories_pkey primary key (id)
);

create table public.materiel_items (
  id uuid not null default gen_random_uuid(),
  categorie_id uuid not null references public.materiel_categories(id),
  entreprise_id uuid not null references public.entreprises(id),
  nom text not null,
  description text null,
  quantite_totale integer null,
  quantite_disponible integer null,
  unite text null,
  seuil_alerte integer null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint materiel_items_pkey primary key (id)
);

create table public.mission_time_logs (
  id uuid not null default gen_random_uuid(),
  mission_id uuid not null references public.missions(id),
  technicien_id uuid not null references public.profiles(id),
  action text not null,
  horodatage timestamp with time zone not null default now(),
  metadata jsonb null,
  constraint mission_time_logs_pkey primary key (id)
);

create table public.missions_materiel (
  id uuid not null default gen_random_uuid(),
  mission_id uuid not null references public.missions(id),
  materiel_id uuid not null references public.materiel_items(id),
  quantite integer not null,
  commentaire text null,
  created_at timestamp with time zone null default now(),
  constraint missions_materiel_pkey primary key (id)
);

-- 7. Table: rapports_techniciens
create table public.rapports_techniciens (
  id uuid not null default gen_random_uuid(),
  mission_id uuid null references public.missions(id),
  technicien_id uuid null references public.profiles(id),
  description text null,
  pieces_utilisees text null,
  temps_passe integer null,
  signature_client text null, -- Nom tronqué sur screen, supposé 'client'
  created_at timestamp with time zone not null default now(),
  constraint rapports_techniciens_pkey primary key (id)
);

-- 8. Table: factures
create table public.factures (
  id uuid not null default gen_random_uuid(),
  mission_id uuid null references public.missions(id),
  montant numeric null,
  commission numeric null,
  statut text null default 'en_attente'::text,
  created_at timestamp without time zone null default now(),
  constraint factures_pkey primary key (id)
);

-- Activation du Row Level Security (RLS) sur toutes les tables (recommandé par Supabase)
alter table public.regie enable row level security;
alter table public.entreprises enable row level security;
alter table public.profiles enable row level security;
alter table public.locataires_details enable row level security;
alter table public.tickets enable row level security;
alter table public.missions enable row level security;
alter table public.rapports_techniciens enable row level security;
alter table public.factures enable row level security;
alter table public.entreprise_techniciens enable row level security;
alter table public.materiel_categories enable row level security;
alter table public.materiel_items enable row level security;
alter table public.mission_time_logs enable row level security;
alter table public.missions_materiel enable row level security;