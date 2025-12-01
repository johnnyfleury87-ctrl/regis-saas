import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée. Utilisez POST."
    });
  }

  try {
    const body = req.body;

    // Champs obligatoires
    if (!body.locataire_id || !body.categorie || !body.piece || !body.detail || !body.dispo1) {
      return res.status(400).json({
        error: "Certains champs obligatoires sont manquants."
      });
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        locataire_id: body.locataire_id,
        regie_id: body.regie_id || null,
        entreprise_id: null,
        technicien_id: null,
        categorie: body.categorie,
        piece: body.piece,
        detail: body.detail,
        description: body.description || null,
        dispo1: body.dispo1,
        dispo2: body.dispo2 || null,
        dispo3: body.dispo3 || null,
        statut: "en_attente",
        adresse: body.adresse || null,
        urgence: 0
      })
      .select();

    if (error) {
      return res.status(500).json({
        error: "Erreur interne: impossible de créer le ticket."
      });
    }

    return res.status(200).json({
      success: true,
      ticket: data[0]
    });

  } catch (err) {
    return res.status(500).json({
      error: "Erreur interne du serveur."
    });
  }
}
