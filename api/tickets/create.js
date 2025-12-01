import { supabase } from "../../utils/supabaseClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const body = req.body;

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        locataire_id: body.locataire_id,
        regie_id: body.regie_id || null,
        categorie: body.categorie,
        sous_categorie: body.piece,
        detail: body.detail,
        description: body.description,
        dispo1: body.dispo1,
        dispo2: body.dispo2,
        dispo3: body.dispo3,
        statut: "en_attente"
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
