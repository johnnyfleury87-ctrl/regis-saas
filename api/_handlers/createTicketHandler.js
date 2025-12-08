import { supabaseServer as supabase } from '../../utils/supabaseClient.js';

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    try {
        const {
            locataire_id,
            categorie,
            piece,
            detail,
            description,
            dispo1,
            dispo2,
            dispo3,
            adresse,
        } = req.body;

        if (!locataire_id || !categorie || !piece || !detail || !description || !dispo1) {
            return res.status(400).json({ error: "Certains champs obligatoires sont manquants." });
        }

        const { data: locataireDetails, error: locataireError } = await supabase
            .from("locataires_details")
            .select("id, regie_id")
            .eq("user_id", locataire_id)
            .maybeSingle();

        if (locataireError) {
            console.error("Erreur récupération détails locataire:", locataireError);
            return res.status(500).json({ error: "Impossible de récupérer les informations du locataire." });
        }

        if (!locataireDetails?.id) {
            return res.status(404).json({ error: "Locataire introuvable." });
        }

        if (!locataireDetails.regie_id) {
            return res.status(400).json({ error: "Ce locataire n'est rattaché à aucune régie." });
        }

        const { data: inserted, error: errorInsert } = await supabase
            .from("tickets")
            .insert({
                locataire_id: locataireDetails.id,
                regie_id: locataireDetails.regie_id,
                categorie,
                piece,
                detail,
                description,
                dispo1,
                dispo2: dispo2 || null,
                dispo3: dispo3 || null,
                adresse: adresse || null,
                statut: "en_attente",
                priorite: "P4",
            })
            .select("id")
            .single();

        if (errorInsert) {
            console.error("Erreur création ticket locataire:", errorInsert);
            return res.status(500).json({
                error: "Erreur lors de la sauvegarde du ticket.",
                details: errorInsert.message,
            });
        }

        return res.status(200).json({ message: "Ticket créé avec succès.", ticketId: inserted.id });
    } catch (err) {
        console.error("Erreur inattendue création ticket:", err);
        return res.status(500).json({ error: "Erreur interne du serveur.", details: err.message });
    }
}