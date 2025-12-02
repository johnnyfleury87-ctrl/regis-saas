import { supabase } from "../../utils/supabase.js";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  try {
    const regieId = req.query.regieId;

    if (!regieId) {
      return res.status(400).json({ error: "regieId manquant" });
    }

    // ■■■ TICKETS + INFOS LOCAIRE COMPLETES ■■■
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        id,
        categorie,
        piece,
        detail,
        description,
        dispo1,
        dispo2,
        dispo3,
        priorite,
        statut,
        created_at,
        adresse,
        locataire_id,
        regie_id,

        locataires_details:locataire_id (
          prenom,
          nom,
          email,
          address,
          zip_code,
          city,
          loyer
        )
      `)
      .eq("regie_id", regieId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur chargement tickets." });
    }

    // restructuration propre
    const tickets = data.map(t => ({
      id: t.id,
      categorie: t.categorie,
      piece: t.piece,
      detail: t.detail,
      description: t.description,
      dispo1: t.dispo1,
      dispo2: t.dispo2,
      dispo3: t.dispo3,
      priorite: t.priorite,
      statut: t.statut,
      created_at: t.created_at,
      adresse: t.locataires_details?.address || null,
      locataire_email: t.locataires_details?.email || null,
      locataire_prenom: t.locataires_details?.prenom || null,
      locataire_nom: t.locataires_details?.nom || null
    }));

    return res.status(200).json({ tickets });

  } catch (err) {
    console.error("Erreur API:", err);
    return res.status(500).json({ error: "Erreur interne serveur" });
  }
}
