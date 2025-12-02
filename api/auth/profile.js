import { supabase } from "../../utils/supabaseClient.js";

export default async function handler(req, res) {
  const accessToken = req.cookies?.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  // Récupère l'utilisateur connecté
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return res.status(401).json({ error: "Utilisateur introuvable" });
  }

  // Cherche le profil dans la table profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: "Profil non trouvé" });
  }

  return res.status(200).json(profile);
}
