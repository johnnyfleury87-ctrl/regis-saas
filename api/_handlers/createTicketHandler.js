import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
  }

  try {
    const body = req.body;
    if (!body.locataire_id || !body.categorie || !body.piece || !body.detail || !body.dispo1) {
      return res.status(400).json({ error: "Certains champs obligatoires sont manquants." });
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert({ ...body, statut: "en_attente" })
      .select();

    if (error) {
      console.error("Erreur Supabase dans createTicketHandler:", error);
      return res.status(500).json({ error: "Impossible de créer le ticket." });
    }

    return res.status(200).json({
      success: true,
      ticket: data[0]
    });

  } catch (err) {
    console.error("Erreur serveur dans createTicketHandler:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
}