import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Méthode non autorisée"
        });
    }

    const regieId = req.query.regieId;

    if (!regieId) {
        return res.status(400).json({
            error: "regieId manquant"
        });
    }

    try {
        const { data, error } = await supabase
            .from("tickets")
            .select("*")
            .eq("regie_id", regieId)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({
                error: "Impossible de charger les tickets"
            });
        }

        return res.status(200).json({ tickets: data });

    } catch (err) {
        return res.status(500).json({
            error: "Erreur serveur"
        });
    }
}
