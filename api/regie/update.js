import { supabase } from "../../utils/supabaseClient.js";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { ticketId, priorite, statut, entreprise_id } = req.body;

  if (!ticketId) {
    return res.status(400).json({ error: "ticketId manquant" });
  }

  const updates = {};
  if (priorite) updates.priorite = priorite;
  if (statut) updates.statut = statut;
  if (entreprise_id !== undefined) updates.entreprise_id = entreprise_id;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ error: "Aucune modification fournie pour le ticket." });
  }

  try {
    const { data, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", ticketId)
      .select("*")
      .single();

    if (error) {
      console.error("Erreur Supabase update ticket:", error);
      return res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du ticket." });
    }

    return res.status(200).json({ ticket: data });
  } catch (err) {
    console.error("Erreur API update ticket:", err);
    return res
      .status(500)
      .json({ error: "Erreur interne du serveur (update ticket)." });
  }
}
