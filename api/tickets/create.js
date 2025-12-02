// /api/tickets/create.js — VERSION DEBUG

import { supabase } from "../supabase.js";

// ⚠️ IMPORTANT : ceci force l’usage du BON client Supabase serveur.

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  console.log("🟦 [DEBUG] Appel API /api/tickets/create");

  if (req.method !== "POST") {
    console.log("🟥 [DEBUG] Mauvaise méthode :", req.method);
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

    // --------- LOG PAYLOAD REÇU ----------
    console.log("🟦 [DEBUG] Payload reçu :", {
      locataire_id,
      categorie,
      piece,
      detail,
      description,
      dispo1,
      dispo2,
      dispo3,
      adresse
    });

    // --------- CHAMPS MANQUANTS ----------
    if (!locataire_id || !categorie || !piece || !detail || !description || !dispo1) {
      console.log("🟥 [DEBUG] Champs manquants !");
      return res.status(400).json({
        error: "Champs obligatoires manquants.",
      });
    }

    // --------- RÉCUPÉRATION PROFIL ----------
    console.log("🟦 [DEBUG] Lecture profil locataire…");

    const { data: profil, error: errorProfil } = await supabaseServer
      .from("profiles")
      .select("regie_id")
      .eq("id", locataire_id)
      .single();

    console.log("🟦 [DEBUG] Résultat profil :", profil);
    console.log("🟥 [DEBUG] Erreur profil :", errorProfil);

    if (errorProfil) {
      return res.status(500).json({
        error: "Impossible de récupérer la régie du locataire.",
        details: errorProfil.message,
      });
    }

    const regie_id = profil?.regie_id || null;

    console.log("🟦 [DEBUG] Regie_id détecté :", regie_id);

    // --------- INSERTION TICKET ----------
    console.log("🟦 [DEBUG] Insertion ticket…");

    const { data: inserted, error: errorInsert } = await supabaseServer
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
        statut: "en_attente",
        priorite: "P4",
      })
      .select("id")
      .single();

    console.log("🟥 [DEBUG] Erreur insertion :", errorInsert);
    console.log("🟩 [DEBUG] Insert OK :", inserted);

    if (errorInsert) {
      return res.status(500).json({
        error: "Erreur lors de la création du ticket.",
        details: errorInsert.message,
      });
    }

    // --------- OK ----------
    return res.status(200).json({
      message: "Ticket créé avec succès.",
      ticketId: inserted.id,
    });

  } catch (err) {
    console.error("🟥 [DEBUG] Exception serveur :", err);
    return res.status(500).json({ 
      error: "Erreur interne du serveur.",
      details: err.message
    });
  }
}
