-- Autorise les nouveaux statuts de mission comme "planifiee"
-- en remplaçant la contrainte CHECK existante sur la colonne statut.

-- Supprime la contrainte CHECK actuelle (si elle existe) sur missions.statut
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'missions'
      AND tc.constraint_type = 'CHECK'
      AND ccu.column_name = 'statut'
  LOOP
    EXECUTE format('ALTER TABLE public.missions DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

-- Ajoute une contrainte élargie couvrant tous les statuts utilisés dans l'app
ALTER TABLE public.missions
  ADD CONSTRAINT missions_statut_check
  CHECK (
    statut IS NULL
    OR statut IN (
      'en_attente',
      'en attente',
      'acceptée',
      'acceptee',
      'planifiée',
      'planifiee',
      'en_cours',
      'en cours',
      'terminée',
      'terminee',
      'annulée',
      'annulee',
      'clôturée',
      'cloturee'
    )
  );
