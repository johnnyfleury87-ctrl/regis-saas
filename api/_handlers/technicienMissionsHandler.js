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

  const { data: missions, error: missionsError } = await supabase
    .from("missions_assignations")
    .select(
      `id, mission_id, technicien_id, statut, is_active, notes, assigned_at,
       mission:missions(
         id,
         ticket:public.tickets(id, categorie, piece, detail, description, adresse, ville, priorite, budget_plafond, dispo1, dispo2, dispo3),
         date_intervention,
         date_acceptation,
         statut,
         locataire:locataires_details(id, prenom, nom, phone, email, address, city, zip_code, building_code, apartment)
       )`
    )
    .eq("technicien_id", profile.id)
    .eq("is_active", true)
    .order("assigned_at", { ascending: false });

  if (missionsError) {
    console.error("Erreur récupération missions technicien:", missionsError);
    return res.status(500).json({ error: "Impossible de récupérer les missions." });
  }

  const payload = (missions || []).map((assignation) => ({
    assignation_id: assignation.id,
    mission_id: assignation.mission?.id,
    statut_assignation: assignation.statut,
    notes: assignation.notes,
    assigned_at: assignation.assigned_at,
    mission: assignation.mission,
  }));

  return res.status(200).json({ missions: payload });
}
