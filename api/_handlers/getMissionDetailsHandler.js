// On importe le client Supabase qui se trouve bien à la racine du projet
import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

async function getEntrepriseContext(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("entreprise_id")
    .eq("id", userId)
    .single();

  if (error || !data?.entreprise_id) {
    return { error: "Entreprise introuvable pour cet utilisateur." };
  }

  return { entrepriseId: data.entreprise_id };
}

export default async function getMissionDetailsHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié." });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Le paramètre id est manquant" });
    }

    const contexte = await getEntrepriseContext(userId);
    if (contexte.error) {
      return res.status(403).json({ error: contexte.error });
    }

    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("*")
      .or(`id.eq.${id},ticket_id.eq.${id}`)
      .maybeSingle();

    if (missionError) {
      console.error("Erreur recherche mission:", missionError);
    }

    if (!mission) {
      return res.status(404).json({ error: "Mission introuvable." });
    }

    if (mission.entreprise_id !== contexte.entrepriseId) {
      return res.status(403).json({ error: "Mission non rattachée à votre entreprise." });
    }

    let ticket = null;
    if (mission.ticket_id) {
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", mission.ticket_id)
        .maybeSingle();

      if (ticketError) {
        console.error("Erreur récupération ticket mission:", ticketError);
      } else {
        ticket = ticketData;
      }
    }

    let locataireDetails = null;
    const locataireId = mission.locataire_id || ticket?.locataire_id;
    if (locataireId) {
      const { data: locataireData, error: locataireError } = await supabase
        .from("locataires_details")
        .select("*")
        .eq("id", locataireId)
        .single();

      if (locataireError) {
        console.error("Erreur lors de la récupération des détails du locataire:", locataireError);
      } else {
        locataireDetails = locataireData;
      }
    }

    const { data: assignations, error: assignationsError } = await supabase
      .from("missions_assignations")
      .select(
        `id, mission_id, technicien_id, entreprise_technicien_id, statut, is_active, notes, assigned_at, acknowledged_at, completed_at,
         technicien:profiles(id, display_name, phone)`
      )
      .eq("mission_id", mission.id)
      .order("assigned_at", { ascending: false });

    if (assignationsError) {
      console.error("Erreur récupération assignations mission:", assignationsError);
    }

    const activeAssignation = (assignations || []).find((item) => item.is_active) || null;

    const responsePayload = {
      ...mission,
      tickets: ticket,
      locataire_details: locataireDetails,
      assignations: assignations || [],
      active_assignation: activeAssignation,
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Erreur dans getMissionDetailsHandler:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}