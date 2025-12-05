import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handleUpdateTicket(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // MODIFICATION : On récupère 'ticketId' et l'objet 'changes'
        const { ticketId, changes } = req.body;

        if (!ticketId) {
            return res.status(400).json({ error: 'ticketId manquant dans la requête.' });
        }
        if (!changes || Object.keys(changes).length === 0) {
            return res.status(400).json({ error: 'Aucun changement fourni.' });
        }

        console.log(`Mise à jour du ticket ${ticketId} avec les données :`, changes);

        const { data, error } = await supabase
            .from('tickets')
            .update(changes) // On passe directement l'objet 'changes'
            .eq('id', ticketId)
            .select()
            .single(); // On s'attend à mettre à jour une seule ligne

        if (error) {
            console.error("Erreur Supabase:", error);
            throw error;
        }
        
        console.log("Ticket mis à jour avec succès:", data);
        return res.status(200).json({ message: 'Ticket mis à jour', data: data });

    } catch (err) {
        console.error("Erreur dans handleUpdateTicket:", err.message);
        return res.status(500).json({ error: "Erreur interne du serveur lors de la mise à jour." });
    }
}