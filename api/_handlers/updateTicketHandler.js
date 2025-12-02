import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handleUpdateTicket(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { ticketId, ...changes } = req.body;
        if (!ticketId) {
            return res.status(400).json({ error: 'ticketId manquant' });
        }

        const { data, error } = await supabase
            .from('tickets')
            .update(changes)
            .eq('id', ticketId)
            .select();

        if (error) throw error;
        
        return res.status(200).json({ message: 'Ticket mis à jour', data: data });

    } catch (err) {
        console.error("Erreur dans handleUpdateTicket:", err);
        return res.status(500).json({ error: err.message });
    }
}