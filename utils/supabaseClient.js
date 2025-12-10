import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "../../utils/supabaseClient.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Client PUBLIC (pour login)
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Retourne un client avec token utilisateur
function getSupabaseClientForSession(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  try {
    // ********* LOGIN AVEC LA ANON KEY **********
    const { data: loginData, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(401).json({ success: false, error: error.message });

    const user = loginData.user;
    const token = loginData.session?.access_token;

    // ********* CLIENT AUTHENTIFIÉ **********
    const supabaseForUser = getSupabaseClientForSession(token);

    const { data: profile, error: profileError } = await supabaseForUser
      .from("profiles")
      .select("role, regie_id, entreprise_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Erreur lecture profil utilisateur", profileError);
      return res.status(500).json({ success: false, error: "Impossible de récupérer le profil" });
    }

    return res.status(200).json({
      success: true,
      role: profile.role,
      regieId: profile.regie_id || null,
      entrepriseId: profile.entreprise_id || null,
      userId: user.id,
    });

  } catch (err) {
    console.error("Erreur dans authHandler:", err);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
}
