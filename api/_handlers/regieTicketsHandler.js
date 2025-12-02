import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handleRegieTickets(req, res) {
  try {
    const regieId = req.query.regieId;

    if (!regieId) {
      return res.status(400).json({ error: "regieId manquant" });
    }

    const { data: tickets, error: errorTickets } = await supabase
      .from("tickets")
      .select("*")
      .eq("regie_id", regieId)
      .order("created_at", { ascending: false });

    if (errorTickets) throw errorTickets;

    const locataireIds = tickets.map((t) => t.locataire_id);
    const { data: locataires, error: errorLoc } = await supabase
      .from("locataires_details")
      .select("*")
      .in("user_id", locataireIds);

    if (errorLoc) throw errorLoc;

    const ticketsFinal = tickets.map((t) => {
      const loc = locataires.find((l) => l.user_id === t.locataire_id) || {};
      return {
        id: t.id,
        categorie: t.categorie, piece: t.piece, detail: t.detail,
        description: t.description, dispo1: t.dispo1, dispo2: t.dispo2,
        dispo3: t.dispo3, priorite: t.priorite, statut: t.statut,
        created_at: t.created_at, budget_plafond: t.budget_plafond,
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