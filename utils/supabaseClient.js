import { createClient } from "@supabase/supabase-js";

// Utiliser SUPABASE_URL est plus standard que NEXT_PUBLIC_SUPABASE_URL pour le backend
const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// On ajoute une vérification pour s'assurer que les variables d'environnement sont bien chargées
if (!supabaseUrl || !supabaseKey) {
  throw new Error("ERREUR CRITIQUE : Les variables d'environnement SUPABASE_URL ou SUPABASE_SERVICE_KEY ne sont pas définies. Le serveur ne peut pas démarrer.");
}

/**
 * Le client Supabase avec les privilèges 'service_role' (admin).
 * À n'utiliser que côté serveur (dans votre dossier /api).
 */
export const supabaseServer = createClient(supabaseUrl, supabaseKey);