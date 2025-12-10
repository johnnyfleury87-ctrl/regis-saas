import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "../../utils/supabaseClient.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

function getSupabaseClientForSession(accessToken) {
  if (!accessToken) {
    return supabaseServer;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("SUPABASE_URL ou SUPABASE_ANON_KEY manquant – utilisation du client service_role.");
    return supabaseServer;
  }

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
    const { data: loginData, error } = await supabaseServer.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ success: false, error: error.message });

    const user = loginData.user;
    const token = loginData.session?.access_token || null;
    const supabaseForUser = getSupabaseClientForSession(token);

    let profileError;
    const { data: profileFromPolicy, error: rlsError } = await supabaseForUser
      .from("profiles")
      .select("role, regie_id, entreprise_id")
      .eq("id", user.id)
      .single();

    let profile = profileFromPolicy;
    profileError = rlsError;

    if (profileError?.code === "42501") {
      console.warn("RLS refusé sur profiles, bascule vers client service_role");
      const { data: profileFromService, error: serviceError } = await supabaseServer
        .from("profiles")
        .select("role, regie_id, entreprise_id")
        .eq("id", user.id)
        .single();
      profile = profileFromService;
      profileError = serviceError;
    }

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