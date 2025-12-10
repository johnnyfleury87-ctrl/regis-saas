import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables SUPABASE_URL ou SERVICE_KEY manquantes !");
}

// Client serveur (admin)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
