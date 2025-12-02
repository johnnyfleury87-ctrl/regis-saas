import { supabase } from "../../utils/supabaseClient.js";


export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const {
    locataire_id,
    categorie,
    piece,
    detail,
    description,
    dispo1,
    dispo2,
    dispo3,
    priorite
  } = req.body;

  if (!locataire_id || !categorie || !piece || !detail || !dispo1) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  try {
    // Récupérer automatiquement la régie du locataire
    const { data: profil, error: errorProfil } = await supabase
      .from("profiles")
      .select("regie_id")
      .eq("id", locataire_id)
      .single();

    if (errorProfil || !profil) {
      return res.status(400).json({
        error: "Impossible de récupérer la régie du locataire."
      });
    }

    const regie_id = profil.regie_id || null;

    // Création du ticket
    const { data, error } = await supabase.from("tickets").insert([
      {
        locataire_id,
        regie_id,
        categorie,
        piece,
        detail,
        description,
        dispo1,
        dispo2,
        dispo3,
        priorite: priorite || "P4",
        statut: "en_attente",
        created_at: new Date()
      }
    ]);

    if (error) {
      console.error(error);
      return res.status(500).json({
        error: "Erreur lors de la création du ticket."
      });
    }

    return res.status(200).json({
      success: true,
      ticket: data[0]
    });

  } catch (err) {
    console.error("Erreur API:", err);
    return res.status(500).json({
      error: "Erreur interne serveur."
    });
  }
}
