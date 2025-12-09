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

async function ensureMissionOwnership(missionId, entrepriseId) {
  const { data, error } = await supabase
    .from("missions")
    .select("id, entreprise_id")
    .eq("id", missionId)
    .single();

  if (error || !data) {
    return { error: "Mission introuvable." };
  }

  if (data.entreprise_id !== entrepriseId) {
    return { error: "Mission non rattachée à votre entreprise." };
  }

  return { mission: data };
}

async function handleGet(req, res, contexte) {
  const missionId = req.query?.mission_id;

  if (!missionId) {
    return res.status(400).json({ error: "Le paramètre mission_id est requis." });
  }

  const { error: missionError } = await ensureMissionOwnership(missionId, contexte.entrepriseId);
  if (missionError) {
    return res.status(404).json({ error: missionError });
  }

  const { data: assignations, error } = await supabase
    .from("missions_assignations")
    .select(
      `id, mission_id, technicien_id, entreprise_technicien_id, statut, is_active, notes, assigned_at, acknowledged_at, completed_at,
       technicien:profiles(id, display_name, phone)`
    )
    .eq("mission_id", missionId)
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("Erreur récupération assignations:", error);
    return res.status(500).json({ error: "Impossible de récupérer les assignations." });
  }

  const activeAssignation = (assignations || []).find((item) => item.is_active) || null;

  return res.status(200).json({ assignations: assignations || [], active_assignation: activeAssignation });
}

async function handlePost(req, res, contexte, userId) {
  const { mission_id: missionId, entreprise_technicien_id: entrepriseTechnicienId, notes } = req.body || {};

  if (!missionId || !entrepriseTechnicienId) {
    return res.status(400).json({ error: "Les paramètres mission_id et entreprise_technicien_id sont requis." });
  }

  const { error: missionError } = await ensureMissionOwnership(missionId, contexte.entrepriseId);
  if (missionError) {
    return res.status(404).json({ error: missionError });
  }

  const { data: technicien, error: technicienError } = await supabase
    .from("entreprise_techniciens")
    .select("id, profile_id, entreprise_id, is_active")
    .eq("id", entrepriseTechnicienId)
    .single();

  if (technicienError || !technicien) {
    return res.status(404).json({ error: "Technicien introuvable." });
  }

  if (technicien.entreprise_id !== contexte.entrepriseId) {
    return res.status(403).json({ error: "Technicien non rattaché à votre entreprise." });
  }

  if (!technicien.is_active) {
    return res.status(400).json({ error: "Ce technicien est désactivé." });
  }

  await supabase
    .from("missions_assignations")
    .update({
      is_active: false,
      completed_at: new Date().toISOString(),
      statut: "inactive",
    })
    .eq("mission_id", missionId)
    .eq("is_active", true);

  const { data: assignation, error: assignationError } = await supabase
    .from("missions_assignations")
    .insert({
      mission_id: missionId,
      technicien_id: technicien.profile_id,
      entreprise_technicien_id: entrepriseTechnicienId,
      assigner_id: userId,
      notes: notes || null,
      statut: "assignée",
      is_active: true,
    })
    .select(
      `id, mission_id, technicien_id, entreprise_technicien_id, statut, is_active, notes, assigned_at,
       technicien:profiles(id, display_name, phone)`
    )
    .single();

  if (assignationError) {
    console.error("Erreur création assignation:", assignationError);
    return res.status(500).json({ error: "Impossible d'assigner ce technicien." });
  }

  const { error: missionUpdateError } = await supabase
    .from("missions")
    .update({ technicien_id: technicien.profile_id })
    .eq("id", missionId);

  if (missionUpdateError) {
    console.error("Erreur mise à jour mission après assignation:", missionUpdateError);
  }

  return res.status(200).json({ assignation });
}

async function handleDelete(req, res, contexte) {
  const { mission_id: missionId } = req.body || {};

  if (!missionId) {
    return res.status(400).json({ error: "Le paramètre mission_id est requis." });
  }

  const { error: missionError } = await ensureMissionOwnership(missionId, contexte.entrepriseId);
  if (missionError) {
    return res.status(404).json({ error: missionError });
  }

  const timestamp = new Date().toISOString();

  const { error: deactivateError } = await supabase
    .from("missions_assignations")
    .update({ is_active: false, completed_at: timestamp, statut: "retirée" })
    .eq("mission_id", missionId)
    .eq("is_active", true);

  if (deactivateError) {
    console.error("Erreur désactivation assignation:", deactivateError);
    return res.status(500).json({ error: "Impossible de retirer l'assignation." });
  }

  const { error: missionUpdateError } = await supabase
    .from("missions")
    .update({ technicien_id: null })
    .eq("id", missionId);

  if (missionUpdateError) {
    console.error("Erreur mise à jour mission après retrait:", missionUpdateError);
  }

  return res.status(200).json({ success: true });
}

export default async function missionAssignationHandler(req, res) {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  const contexte = await getEntrepriseContext(userId);

  if (contexte.error) {
    return res.status(403).json({ error: contexte.error });
  }

  switch (req.method) {
    case "GET":
      return handleGet(req, res, contexte);
    case "POST":
      return handlePost(req, res, contexte, userId);
    case "DELETE":
      return handleDelete(req, res, contexte);
    default:
      return res.status(405).json({ error: "Méthode non autorisée." });
  }
}
