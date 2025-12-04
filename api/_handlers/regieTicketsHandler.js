import { createClient } from '@supabase/supabase-js';

// Initialise le client Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function regieTicketsHandler(req, res) {
    // Récupère le 'regieId' depuis les paramètres de l'URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const regieId = url.searchParams.get('regieId');

    if (!regieId) {
        return res.status(400).json({ error: "L'ID de la régie est manquant." });
    }

    try {
        // --- REQUÊTE CORRIGÉE ---
        const { data: tickets, error } = await supabase
            .from('tickets')
            // 1. On sélectionne toutes les colonnes de 'tickets' ET les infos de la bonne table de locataires
            .select(`
                id,
                created_at,
                categorie,
                piece,
                description,
                statut,
                priorite,
                budget_plafond,
                dispo1,
                dispo2,
                dispo3,
                locataire: locataires_details (nom, prenom, address, zip_code, city)
            `)
            // 2. On filtre toujours par le bon regie_id
            .eq('regie_id', regieId);

        if (error) {
            // Si Supabase renvoie une erreur, on l'envoie au client
            throw new Error(`Erreur Supabase: ${error.message}`);
        }

        // On formate les données pour le front-end
        const formattedTickets = tickets.map(ticket => {
            const locataire = ticket.locataire || {};
            return {
                ...ticket,
                locataireNom: `${locataire.prenom || ''} ${locataire.nom || ''}`.trim(),
                locataireAdresse: `${locataire.address || ''}, ${locataire.zip_code || ''} ${locataire.city || ''}`.trim(),
                // On s'assure que le locataire est bien un objet, même s'il est vide
                locataire: locataire 
            };
        });
        
        return res.status(200).json({ tickets: formattedTickets });

    } catch (err) {
        console.error("Erreur lors de la récupération des tickets pour la régie:", err.message);
        return res.status(500).json({ error: err.message });
    }
}