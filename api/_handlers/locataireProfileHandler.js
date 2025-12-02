import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handleLocataireProfile(req, res) {
    if (req.method === 'POST') {
        const { userId, prenom, nom, phone, address, zip_code, city } = req.body;
        const { data, error } = await supabase
            .from('locataires_details')
            .update({ prenom, nom, phone, address, zip_code, city })
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }
    // Ajoutez ici d'autres méthodes (GET, etc.) si nécessaire
    return res.status(405).json({ error: 'Méthode non autorisée' });
}