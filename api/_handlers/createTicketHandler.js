import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handleCreateTicket(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // La logique de création de ticket se trouve ici
        const { data, error } = await supabase.from('tickets').insert([req.body]).select();

        if (error) {
            console.error("Erreur création ticket:", error);
            return res.status(500).json({ error: "Erreur lors de la création du ticket." });
        }
        
        return res.status(201).json({ message: 'Ticket créé avec succès', ticket: data[0] });

    } catch (err) {
        console.error("Erreur serveur dans handleCreateTicket:", err);
        return res.status(500).json({ error: err.message });
    }
}