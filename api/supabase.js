import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Variables SUPABASE_URL ou SUPABASE_SERVICE_KEY manquantes !");
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey);
