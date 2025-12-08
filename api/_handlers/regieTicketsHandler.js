import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handleRegieTickets(req, res) {
  try {
    const { regieId } = req.query;

    // Base query
    let query = supabase.from("tickets").select("*");

    if (regieId) {
      // Vue RÉGIE → tous les tickets de la régie
      query = query.eq("regie_id", regieId);
    } else {
      // Vue ENTREPRISE → uniquement les tickets publiés et non encore pris
      query = query
        .eq("statut", "publie")
        .is("entreprise_id", null);
    }

    const { data: tickets, error: errorTickets } = await query.order(
      "created_at",
      { ascending: false }
    );
    if (errorTickets) throw errorTickets;

    if (!tickets || tickets.length === 0) {
      return res.status(200).json({ tickets: [] });
    }

    // 🔹 CAS RÉGIE : on enrichit avec les infos locataire
    if (regieId) {
      const locataireIds = tickets.map((t) => t.locataire_id).filter(Boolean);
      const entrepriseIds = tickets.map((t) => t.entreprise_id).filter(Boolean);

      let locataires = [];
      if (locataireIds.length > 0) {
        const { data: locs, error: errorLoc } = await supabase
          .from("locataires_details")
          .select("*")
          .in("id", locataireIds);

        if (errorLoc) throw errorLoc;
        locataires = locs || [];
      }

      let entreprises = [];
      if (entrepriseIds.length > 0) {
        const { data: ents, error: errorEnt } = await supabase
          .from("entreprises")
          .select("id, name, contact_email, contact_phone")
          .in("id", entrepriseIds);

        if (errorEnt) throw errorEnt;
        entreprises = ents || [];
      }

      const ticketsFinal = tickets.map((t) => {
        const loc = locataires.find((l) => l.id === t.locataire_id) || {};
        const ent = entreprises.find((e) => e.id === t.entreprise_id) || null;
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
          budget_plafond: t.budget_plafond,
          budget_plafond: t.budget_plafond,
          ville: t.ville,
          locataire_prenom: loc.prenom,
          locataire_nom: loc.nom,
          locataire_email: loc.email,
          adresse: loc.address,
          zip_code: loc.zip_code,
          city: loc.city,
          phone: loc.phone,
          entreprise_id: t.entreprise_id,
          entreprise_nom: ent?.name || null,
          entreprise_email: ent?.contact_email || null,
          entreprise_phone: ent?.contact_phone || null,
        };
      });

      return res.status(200).json({ tickets: ticketsFinal });
    }

    // 🔹 CAS ENTREPRISE : version ANONYMISÉE (pas d'infos locataire)
    const ticketsEntreprise = tickets.map((t) => ({
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
      budget_plafond: t.budget_plafond,
      ville: t.ville,
    }));

    return res.status(200).json({ tickets: ticketsEntreprise });
  } catch (err) {
    console.error("Erreur dans handleRegieTickets:", err);
    return res
      .status(500)
      .json({ error: "Erreur interne du serveur (tickets régie)." });
  }
}
