import { supabase } from "../../utils/supabaseClient.js";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  try {
    const regieId = req.query.regieId;

    if (!regieId) {
      return res.status(400).json({ error: "regieId manquant" });
    }

    // 1) Récupération des tickets
    const { data: tickets, error: errorTickets } = await supabase
      .from("tickets")
      .select("*")
      .eq("regie_id", regieId)
      .order("created_at", { ascending: false });

    if (errorTickets) {
      console.error(errorTickets);
      return res.status(500).json({ error: "Erreur chargement tickets." });
    }

    // 2) Récupération des locataires liés
    const locataireIds = tickets.map((t) => t.locataire_id);

    const { data: locataires, error: errorLoc } = await supabase
      .from("locataires_details")
      .select("*")
      .in("user_id", locataireIds);

    if (errorLoc) {
      console.error(errorLoc);
      return res.status(500).json({ error: "Erreur chargement détails locataire." });
    }

    // 3) Fusion des données
    const ticketsFinal = tickets.map((t) => {
      const loc = locataires.find((l) => l.user_id === t.locataire_id) || {};

      return {
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

        locataire_prenom: loc.prenom || null,
        locataire_nom: loc.nom || null,
        locataire_email: loc.email || null,
        adresse: loc.address || null,
        zip_code: loc.zip_code || null,
        city: loc.city || null,
      };
    });

    return res.status(200).json({ tickets: ticketsFinal });
  } catch (err) {
    console.error("Erreur API:", err);
    return res.status(500).json({ error: "Erreur interne serveur" });
  }
}
