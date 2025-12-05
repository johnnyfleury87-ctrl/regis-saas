import { supabaseServer } from "../../utils/supabaseClient.js";

export default async function handleRegieTickets(req, res) {
  try {
    const { regieId } = req.query;

    let query = supabase.from("tickets").select("*");

    if (regieId) {
      // Pour la page régie, on filtre par regieId
      query = query.eq("regie_id", regieId);
    } else {
      // POUR LA PAGE ENTREPRISE : on filtre par statut "publie"
      query = query.eq("statut", "publie");
    }

    const { data: tickets, error: errorTickets } = await query.order("created_at", { ascending: false });
    if (errorTickets) throw errorTickets;

    if (!tickets || tickets.length === 0) {
      return res.status(200).json({ tickets: [] });
    }

    // Le reste du code pour enrichir les tickets avec les détails du locataire est bon et reste inchangé.
    const locataireIds = tickets.map((t) => t.locataire_id);
    const { data: locataires, error: errorLoc } = await supabase
      .from("locataires_details")
      .select("*")
      .in("user_id", locataireIds);
    if (errorLoc) throw errorLoc;

    const ticketsFinal = tickets.map((t) => {
      const loc = locataires.find((l) => l.user_id === t.locataire_id) || {};
      return {
        id: t.id, categorie: t.categorie, piece: t.piece, detail: t.detail,
        description: t.description, dispo1: t.dispo1, dispo2: t.dispo2,
        dispo3: t.dispo3, priorite: t.priorite, statut: t.statut,
        created_at: t.created_at, budget_plafond: t.budget_plafo,
        locataire_prenom: loc.prenom, locataire_nom: loc.nom,
        locataire_email: loc.email, adresse: loc.address,
        zip_code: loc.zip_code, city: loc.city, phone: loc.phone,
      };
    });

    return res.status(200).json({ tickets: ticketsFinal });
  } catch (err) {
    console.error("Erreur dans handleRegieTickets:", err);
    return res.status(500).json({ error: err.message });
  }
}