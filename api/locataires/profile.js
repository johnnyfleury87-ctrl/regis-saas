import { supabase } from "../../utils/supabaseClient.js";



export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    // Charger profil du user
    const { data: profil, error: profilErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profilErr) {
      return res.status(500).json({ error: profilErr.message });
    }

    // Charger détails locataire
    const { data: details, error: detailsErr } = await supabase
      .from("locataires_details")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (detailsErr) {
      return res.status(500).json({ error: detailsErr.message });
    }

    // Structure propre pour le front
    return res.status(200).json({
      locataire: {
        id: profil.id,
        prenom: details.prenom,
        nom: details.nom,
        address: details.address,
        zip_code: details.zip_code,
        city: details.city,
        loyer: details.loyer,
        email: profil.email
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
