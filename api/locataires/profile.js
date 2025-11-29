import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    // Charger profil
    const { data: profil, error: profilErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profilErr) {
      return res.status(500).json({ error: profilErr.message });
    }

    // Charger détails logement
    const { data: details, error: detailsErr } = await supabase
      .from("locataires_details")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (detailsErr) {
      return res.status(500).json({ error: detailsErr.message });
    }

    return res.status(200).json({
      profil,
      details
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
