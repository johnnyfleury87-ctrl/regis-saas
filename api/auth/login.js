import { supabaseServer } from "../../supabase/utils/supabaseClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      user: data.user,
      session: data.session
    });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
