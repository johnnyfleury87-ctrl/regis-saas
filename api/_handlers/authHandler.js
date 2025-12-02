// On adapte le chemin d'importation
import { supabaseServer } from "../../utils/supabaseClient.js";

// On exporte une fonction qui contient TOUTE votre logique de login
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  try {
    const { data: loginData, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    const user = loginData.user;
    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("role, regie_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ success: false, error: "Impossible de récupérer le profil" });
    }

    return res.status(200).json({
      success: true,
      role: profile.role,
      regieId: profile.regie_id || null,
      userId: user.id,
    });

  } catch (err) {
    console.error("Erreur serveur dans authHandler:", err);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
}