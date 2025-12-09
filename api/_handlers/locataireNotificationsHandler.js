import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

async function getLocataireIdFromUser(userId) {
  const { data, error } = await supabase
    .from("locataires_details")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data?.id) {
    return { error: "Profil locataire introuvable." };
  }

  return { locataireId: data.id };
}

export default async function locataireNotificationsHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const userId = req.headers["x-user-id"] || req.query?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  const { locataireId, error } = await getLocataireIdFromUser(userId);
  if (error) {
    return res.status(403).json({ error });
  }

  const { data, error: notificationsError } = await supabase
    .from("locataire_notifications")
    .select(
      "id, title, message, type, channel, payload, delivery_status, sent_at, read_at, created_at, ticket_id, mission_id"
    )
    .eq("locataire_id", locataireId)
    .order("created_at", { ascending: false });

  if (notificationsError) {
    console.error("Erreur récupération notifications locataire:", notificationsError);
    return res.status(500).json({ error: "Impossible de récupérer les notifications." });
  }

  return res.status(200).json({ notifications: data || [] });
}