// /api/tickets/create.js
import { supabase } from "../supabase.js";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const {
      locataire_id,
      categorie,
      piece,
      detail,
      description,
      dispo1,
      dispo2,
      dispo3
    } = req.body;

    // Vérifications des champs obligatoires
    if (!locataire_id || !categorie || !piece || !detail || !description || !dispo1) {
      return res.status(400).json({
        error: "Champs obligatoires manquants.",
      });
    }

    // 1) Récupérer la régie associée
    const { data: profil, error: errorProfil } = await supabaseServer
      .from("profiles")
      .select("regie_id")
      .eq("id", locataire_id)
      .single();

    if (errorProfil) {
      console.error("Erreur profil locataire:", errorProfil);
      return res.status(500).json({
        error: "Impossible de récupérer la régie du locataire.",
      });
    }

    const regie_id = profil?.regie_id || null;

    // 2) Insertion du ticket
    const { data, error: errorInsert } = await supabaseServer
      .from("tickets")
      .insert({
        locataire_id,
        regie_id,
        categorie,
        piece,
        detail,
        description,
        dispo1,
        dispo2: dispo2 || null,
        dispo3: dispo3 || null,
        statut: "en_attente",
        priorite: "P4"
      })
      .select()
      .single();

    if (errorInsert) {
      console.error("Erreur insertion ticket:", errorInsert);
      return res.status(500).json({
        error: "Erreur lors de la création du ticket.",
      });
    }

    return res.status(200).json({
      message: "Ticket créé avec succès.",
      ticketId: data.id,
    });

  } catch (err) {
    console.error("Erreur API create ticket:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
}
