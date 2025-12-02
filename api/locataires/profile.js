import { supabaseServer } from "../../utils/supabaseClient.js";

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
    const { data: profil, error: profilErr } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profilErr) {
      console.error("Erreur Supabase (profiles):", profilErr);
      return res.status(500).json({ error: "Impossible de charger le profil utilisateur." });
    }

    // Charger détails locataire
    const { data: details, error: detailsErr } = await supabaseServer
      .from("locataires_details")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (detailsErr) {
      console.error("Erreur Supabase (locataires_details):", detailsErr);
      // C'est souvent ici que ça peut échouer si un locataire n'a pas de détails
      return res.status(500).json({ error: "Impossible de charger les détails du locataire." });
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
        email: profil.email // Assurez-vous que la table 'profiles' a bien une colonne 'email'
      }
    });

  } catch (err) {
    console.error("Erreur inattendue dans /api/locataires/profile:", err);
    return res.status(500).json({ error: "Une erreur serveur inattendue est survenue." });
  }
}