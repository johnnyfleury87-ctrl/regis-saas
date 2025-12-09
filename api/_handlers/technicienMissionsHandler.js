import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

async function getTechnicienProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, entreprise_id")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { error: "Profil technicien introuvable." };
  }

  if (!data.entreprise_id) {
    return { error: "Technicien non rattaché à une entreprise." };
  }

  return { profile: data };
}

function normaliseMissionPayload(mission, ticketMap, locataireMap) {
  if (!mission) {
    return null;
  }

  const ticket = mission.ticket_id ? ticketMap.get(mission.ticket_id) || null : null;
  const locataireId = mission.locataire_id || ticket?.locataire_id || null;
  const locataire = locataireId ? locataireMap.get(locataireId) || null : null;

  return {
    ...mission,
    ticket,
    locataire,
  };
}

export default async function technicienMissionsHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const userId = req.headers["x-user-id"] || req.query?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  const { profile, error } = await getTechnicienProfile(userId);
  if (error) {
    return res.status(403).json({ error });
  }

  const { data: assignations, error: assignationsError } = await supabase
    .from("missions_assignations")
    .select("id, mission_id, technicien_id, statut, is_active, notes, assigned_at")
    .eq("technicien_id", profile.id)
    .eq("is_active", true)
    .order("assigned_at", { ascending: false });

  if (assignationsError) {
    console.error("Erreur récupération missions technicien:", assignationsError);
    return res.status(500).json({ error: "Impossible de récupérer les missions." });
  }

  if (!assignations?.length) {
    return res.status(200).json({ missions: [] });
  }

  const missionIds = Array.from(new Set(assignations.map((item) => item.mission_id).filter(Boolean)));

  const { data: missions, error: missionsError } = await supabase
    .from("missions")
    .select("id, ticket_id, locataire_id, statut, date_acceptation, date_intervention, commentaire")
    .in("id", missionIds);

  if (missionsError) {
    console.error("Erreur récupération détails missions:", missionsError);
    return res.status(500).json({ error: "Impossible de récupérer les missions." });
  }

  const missionMap = new Map((missions || []).map((mission) => [mission.id, mission]));

  const ticketIds = Array.from(new Set((missions || []).map((mission) => mission.ticket_id).filter(Boolean)));

  let tickets = [];
  if (ticketIds.length) {
    const { data: ticketsData, error: ticketsError } = await supabase
      .from("tickets")
      .select(
        "id, locataire_id, categorie, piece, detail, description, adresse, ville, priorite, budget_plafond, dispo1, dispo2, dispo3"
      )
      .in("id", ticketIds);

    if (ticketsError) {
      console.error("Erreur récupération tickets missions technicien:", ticketsError);
      return res.status(500).json({ error: "Impossible de récupérer les missions." });
    }

    tickets = ticketsData || [];
  }

  const ticketMap = new Map(tickets.map((ticket) => [ticket.id, ticket]));

  const locataireIds = new Set();
  (missions || []).forEach((mission) => {
    if (mission.locataire_id) locataireIds.add(mission.locataire_id);
  });
  tickets.forEach((ticket) => {
    if (ticket.locataire_id) locataireIds.add(ticket.locataire_id);
  });

  let locataires = [];
  if (locataireIds.size) {
    const { data: locatairesData, error: locatairesError } = await supabase
      .from("locataires_details")
      .select("id, prenom, nom, phone, email, address, city, zip_code, building_code, apartment")
      .in("id", Array.from(locataireIds));

    if (locatairesError) {
      console.error("Erreur récupération locataires missions technicien:", locatairesError);
      return res.status(500).json({ error: "Impossible de récupérer les missions." });
    }

    locataires = locatairesData || [];
  }

  const locataireMap = new Map(locataires.map((locataire) => [locataire.id, locataire]));

  const payload = assignations.map((assignation) => ({
    assignation_id: assignation.id,
    mission_id: assignation.mission_id,
    statut_assignation: assignation.statut,
    notes: assignation.notes,
    assigned_at: assignation.assigned_at,
    mission: normaliseMissionPayload(missionMap.get(assignation.mission_id), ticketMap, locataireMap),
  }));

  return res.status(200).json({ missions: payload });
}
