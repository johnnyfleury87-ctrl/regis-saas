// Importe le client Supabase et le helper pour récupérer l'utilisateur
import { supabaseServer as supabase } from "../../utils/supabaseClient.js";
import { getSupabaseUser } from "../../utils/user"; // Assurez-vous que ce chemin est correct

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 1. Récupérer l'utilisateur connecté depuis le backend
    const user = await getSupabaseUser(req, res);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié." });
    }
    const entrepriseId = user.id; // Voici l'ID de l'entreprise !

    // 2. Récupérer SEULEMENT le ticket_id depuis le frontend
    const { ticket_id } = req.body;
    if (!ticket_id) {
      return res.status(400).json({ error: "Le paramètre 'ticket_id' est requis." });
    }

    // 3. Créer la nouvelle mission (logique inchangée, mais maintenant avec le bon entrepriseId)
    const { data: missionData, error: missionError } = await supabase
      .from('missions')
      .insert({
        ticket_id: ticket_id,
        entreprise_id: entrepriseId, // L'ID est récupéré de manière sécurisée
        statut: 'acceptée',
        date_acceptation: new Date().toISOString(),
      })
      .select().single();
    if (missionError) {
      console.error('Erreur Supabase (création mission):', missionError);
      return res.status(500).json({ error: 'Erreur lors de la création de la mission.' });
    }

    // 4. Mettre à jour le statut du ticket à "en cours" (logique inchangée)
    const { error: ticketError } = await supabase
      .from('tickets')
      .update({ statut: 'en cours' })
      .eq('id', ticket_id);
    if (ticketError) {
      console.error('Erreur Supabase (MAJ ticket):', ticketError);
      return res.status(500).json({ error: 'La mission a été créée, mais erreur lors de la mise à jour du ticket.' });
    }

    // 5. Succès
    res.status(200).json({ message: 'Mission créée et ticket mis à jour.', mission: missionData });

  } catch (e) {
    console.error('Erreur inattendue:', e);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};