import { supabaseServer } from "../../utils/supabaseClient.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const userId = req.headers["x-user-id"] || req.query?.userId;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const { data: profil, error: profilErr } = await supabaseServer
      .from("profiles")
      .select("id, display_name, phone, role")
      .eq("id", userId)
      .maybeSingle();

    if (profilErr || !profil) {
      return res.status(404).json({ error: "Profil utilisateur introuvable." });
    }

    const { data: details, error: detailsErr } = await supabaseServer
      .from("locataires_details")
      .select("id, prenom, nom, email, phone, address, zip_code, city, building_code, apartment, loyer")
      .eq("user_id", userId)
      .maybeSingle();

    if (detailsErr || !details) {
      return res.status(404).json({ error: "Impossible de charger les détails du locataire." });
    }

    return res.status(200).json({
      locataire: {
        id: profil.id,
        prenom: details.prenom,
        nom: details.nom,
        address: details.address,
        zip_code: details.zip_code,
        city: details.city,
        loyer: details.loyer,
        email: details.email || profil.email,
        phone: details.phone || profil.phone,
        building_code: details.building_code,
        apartment: details.apartment,
      },
    });
  } catch (err) {
    console.error("Erreur locataireProfileHandler:", err);
    return res.status(500).json({ error: "Une erreur serveur inattendue est survenue." });
  }
}