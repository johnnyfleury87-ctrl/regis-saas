// /api/tickets/create.js

import { supabase } from "../../utils/supabaseClient.js";

export const config = {
  api: { bodyParser: true }, // on reçoit du JSON, pas de fichier
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
      dispo3,
      adresse,
    } = req.body;

    // 🔎 Vérif basique des champs obligatoires
    if (!locataire_id || !categorie || !piece || !detail || !description || !dispo1) {
      return res.status(400).json({
        error:
          "Certains champs obligatoires sont manquants (locataire, type de problème, pièce, détail, description, disponibilité 1).",
      });
    }

    // 1️⃣ Récupérer la régie liée au locataire via la table profiles
    const { data: profil, error: errorProfil } = await supabase
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

    // 2️⃣ Insert du ticket
    const { data: inserted, error: errorInsert } = await supabase
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
        adresse: adresse || null,
        statut: "en_attente", // statut initial
        priorite: "P4",       // priorité par défaut, la régie pourra changer
      })
      .select("id")
      .single();

    if (errorInsert) {
      console.error("Erreur insertion ticket:", errorInsert);
      return res.status(500).json({
        error: "Erreur lors de la création du ticket.",
      });
    }

    // 3️⃣ Réponse OK avec l’ID du ticket
    return res.status(200).json({
      message: "Ticket créé avec succès.",
      ticketId: inserted.id,
    });
  } catch (err) {
    console.error("Erreur API create ticket:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
}
