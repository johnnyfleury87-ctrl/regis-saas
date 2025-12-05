import { supabaseServer as supabase } from "../../utils/supabaseClient.js";


export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const { data: profil, error: profilErr } = await supabaseServer.from("profiles").select("*").eq("id", userId).single();
    if (profilErr) return res.status(500).json({ error: "Impossible de charger le profil utilisateur." });

    const { data: details, error: detailsErr } = await supabaseServer.from("locataires_details").select("*").eq("user_id", userId).single();
    if (detailsErr) return res.status(500).json({ error: "Impossible de charger les détails du locataire." });

    return res.status(200).json({
      locataire: { id: profil.id, prenom: details.prenom, nom: details.nom, address: details.address, zip_code: details.zip_code, city: details.city, loyer: details.loyer, email: profil.email }
    });
  } catch (err) {
    return res.status(500).json({ error: "Une erreur serveur inattendue est survenue." });
  }
}