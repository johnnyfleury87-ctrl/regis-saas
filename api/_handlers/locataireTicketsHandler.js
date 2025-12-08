import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function locataireTicketsHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Paramètre userId requis." });
  }

  try {
    const { data: locatairesRows, error: locataireLookupError } = await supabase
      .from("locataires_details")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (locataireLookupError) {
      throw locataireLookupError;
    }

    const locataireDetails = Array.isArray(locatairesRows) && locatairesRows.length > 0
      ? locatairesRows[0]
      : null;

    const identifiers = new Set([userId]);
    if (locataireDetails?.id) {
      identifiers.add(locataireDetails.id);
    }

    const matchIds = Array.from(identifiers);

    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(
        "id, categorie, piece, detail, description, statut, priorite, created_at, updated_at, entreprise_id, missions(id, statut, date_intervention)"
      )
      .in("locataire_id", matchIds)
      .order("created_at", { ascending: false });

    if (ticketsError) {
      throw ticketsError;
    }

    if (!tickets || tickets.length === 0) {
      return res.status(200).json({ tickets: [] });
    }

    const entrepriseIds = tickets
      .map((ticket) => ticket.entreprise_id)
      .filter(Boolean);

    let entreprises = [];
    if (entrepriseIds.length > 0) {
      const { data: entreprisesData, error: entreprisesError } = await supabase
        .from("entreprises")
        .select("id, name")
        .in("id", entrepriseIds);

      if (entreprisesError) throw entreprisesError;
      entreprises = entreprisesData || [];
    }

    const entrepriseMap = new Map(
      entreprises.map((entreprise) => [entreprise.id, entreprise])
    );

    const payload = tickets.map((ticket) => {
      const missionData = Array.isArray(ticket.missions)
        ? ticket.missions[0]
        : ticket.missions;

      return {
        id: ticket.id,
        categorie: ticket.categorie,
        piece: ticket.piece,
        detail: ticket.detail,
        description: ticket.description,
        statut: ticket.statut,
        priorite: ticket.priorite,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        entreprise: ticket.entreprise_id
          ? entrepriseMap.get(ticket.entreprise_id) || null
          : null,
        mission: missionData
          ? {
              id: missionData.id,
              statut: missionData.statut,
              date_intervention: missionData.date_intervention,
            }
          : null,
      };
    });

    return res.status(200).json({ tickets: payload });
  } catch (error) {
    console.error("Erreur locataireTicketsHandler:", error);
    return res.status(500).json({ error: "Erreur interne serveur." });
  }
}
