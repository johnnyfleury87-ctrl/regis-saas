import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handleEntrepriseMissions(req, res) {
    try {
        const { data, error } = await supabase
          .from("tickets")
          .select(`id, ville, priorite, dispo1, categorie, piece, budget_plafond`)
          .eq("statut", "publie")
          .is("entreprise_id", null)
          .order("created_at", { ascending: false });
    
        if (error) throw error;
    
        return res.status(200).json({ missions: data });
    } catch (err) {
        console.error("Erreur dans handleEntrepriseMissions:", err);
        return res.status(500).json({ error: err.message });
    }
}