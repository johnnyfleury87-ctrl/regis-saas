import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        id,
        ville,
        priorite,
        dispo1,
        dispo2,
        dispo3,
        categorie,
        piece,
        detail,
        budget_plafond,
        created_at
      `)
      .eq("statut", "publie") // On ne prend que les missions publiées !
      .is("entreprise_id", null) // Et qui n'ont pas encore été acceptées
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur API (missions entreprise):", error);
      return res.status(500).json({ error: "Erreur lors du chargement des missions." });
    }

    // IMPORTANT : On ne renvoie PAS de données personnelles ici.
    // L'API est sécurisée par sa conception même.
    return res.status(200).json({ missions: data });

  } catch (err) {
    console.error("Erreur interne API (missions entreprise):", err);
    return res.status(500).json({ error: "Erreur interne serveur" });
  }
}