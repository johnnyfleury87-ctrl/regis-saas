import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function entrepriseGetTicketsDisponiblesHandler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // On récupère les tickets publiés
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("statut", "publie")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ tickets });
  } catch (err) {
    console.error("Erreur entrepriseGetTicketsDisponiblesHandler:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
}
