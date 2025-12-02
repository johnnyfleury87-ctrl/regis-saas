import { supabase } from "../../utils/supabaseClient.js";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  try {
    // Connexion
    const { data: loginData, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const user = loginData.user;

    // Récupération du profil (avec regie_id)
    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("role, regie_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: "Impossible de récupérer le profil" });
    }

    return res.status(200).json({
      success: true,
      role: profile.role,
      regieId: profile.regie_id || null,
      userId: user.id,
    });

  } catch (err) {
    console.error("Erreur serveur login:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
