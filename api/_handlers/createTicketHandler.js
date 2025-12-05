import { supabaseServer } from "../../utils/supabaseClient.js";


export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
    try {
        const { locataire_id, categorie, piece, detail, description, dispo1, dispo2, dispo3, adresse } = req.body;
        if (!locataire_id || !categorie || !piece || !detail || !description || !dispo1) {
            return res.status(400).json({ error: "Certains champs obligatoires sont manquants." });
        }
        const { data: profil, error: errorProfil } = await supabaseServer.from("profiles").select("regie_id").eq("id", locataire_id).single();
        if (errorProfil || !profil) return res.status(500).json({ error: "Impossible de récupérer les informations de la régie." });
        const { data: inserted, error: errorInsert } = await supabaseServer.from("tickets").insert({ locataire_id, regie_id: profil.regie_id, categorie, piece, detail, description, dispo1, dispo2: dispo2 || null, dispo3: dispo3 || null, adresse: adresse || null, statut: "en_attente", priorite: "P4" }).select("id").single();
        if (errorInsert) return res.status(500).json({ error: "Erreur lors de la sauvegarde du ticket.", details: errorInsert.message });
        return res.status(200).json({ message: "Ticket créé avec succès.", ticketId: inserted.id });
    } catch (err) {
        return res.status(500).json({ error: "Erreur interne du serveur.", details: err.message });
    }
}