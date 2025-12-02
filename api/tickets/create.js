import { supabaseServer } from "../../utils/supabaseClient.js";

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
      dispo3,
      adresse,
    } = req.body;

    // Validation des champs obligatoires
    if (!locataire_id || !categorie || !piece || !detail || !description || !dispo1) {
      console.error("Champs manquants lors de la création du ticket:", req.body);
      return res.status(400).json({ error: "Certains champs obligatoires sont manquants." });
    }

    // Récupérer le `regie_id` associé au locataire depuis la table `profiles`
    const { data: profil, error: errorProfil } = await supabaseServer
      .from("profiles")
      .select("regie_id")
      .eq("id", locataire_id)
      .single();

    if (errorProfil || !profil) {
      console.error(`Impossible de trouver le profil pour locataire_id: ${locataire_id}`, errorProfil);
      return res.status(500).json({ error: "Impossible de récupérer les informations de la régie pour ce locataire." });
    }

    const regie_id = profil.regie_id;
    if (!regie_id) {
        return res.status(500).json({ error: "Le locataire n'est associé à aucune régie." });
    }

    // Insérer le nouveau ticket dans la base de données
    const { data: inserted, error: errorInsert } = await supabaseServer
      .from("tickets")
      .insert({
        locataire_id,
        regie_id, // Ajout du regie_id récupéré
        categorie,
        piece,
        detail,
        description,
        dispo1,
        dispo2: dispo2 || null,
        dispo3: dispo3 || null,
        adresse: adresse || null,
        statut: "en_attente", // Statut initial
        priorite: "P4",       // Priorité par défaut
      })
      .select("id")
      .single();

    if (errorInsert) {
      console.error("Erreur d'insertion du ticket dans Supabase:", errorInsert);
      return res.status(500).json({ error: "Une erreur est survenue lors de la sauvegarde du ticket.", details: errorInsert.message });
    }

    // Envoyer une réponse de succès
    return res.status(200).json({
      message: "Ticket créé avec succès.",
      ticketId: inserted.id,
    });

  } catch (err) {
    console.error("Exception inattendue dans /api/tickets/create:", err);
    return res.status(500).json({ error: "Erreur interne du serveur.", details: err.message });
  }
}