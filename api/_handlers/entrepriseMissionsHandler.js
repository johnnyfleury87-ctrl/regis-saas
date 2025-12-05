import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function entrepriseMissionsHandler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    // 1️⃣ RÉCUPÉRER L’UTILISATEUR VIA LE COOKIE
    const { data: { user }, error: userError } = await supabase.auth.getUser(req);

    if (userError || !user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // 2️⃣ RÉCUPÉRER LE PROFIL (PERMET D'OBTENIR entreprise_id)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("entreprise_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.entreprise_id) {
      return res.status(400).json({ error: "Profil entreprise introuvable" });
    }

    const entrepriseId = profile.entreprise_id;

    // 3️⃣ RÉCUPÉRER LA RÉGIE ASSOCIÉE
    const { data: entreprise, error: entError } = await supabase
      .from("entreprises")
      .select("regie_id")
      .eq("id", entrepriseId)
      .single();

    if (entError || !entreprise) {
      return res.status(400).json({ error: "Impossible de récupérer la régie" });
    }

    const regieId = entreprise.regie_id;

    // 4️⃣ RÉCUPÉRER LES TICKETS PUBLIÉS POUR CETTE RÉGIE
    const { data: tickets, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("regie_id", regieId)
      .eq("statut", "publie");

    if (ticketError) throw ticketError;

    return res.status(200).json({ missions: tickets });

  } catch (err) {
    console.error("Erreur entrepriseMissionsHandler:", err);
    return res.status(500).json({ error: "Erreur interne serveur." });
  }
}
