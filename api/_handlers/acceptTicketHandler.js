// Importe le client Supabase
import { supabaseServer } from "../../utils/supabaseClient.js";

// Exporte la fonction handler asynchrone
module.exports = async (req, res) => {
  // 1. S'assurer que la méthode est bien POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 2. Récupérer les ID nécessaires depuis le corps de la requête.
    // Le front-end doit envoyer l'ID du ticket et l'ID de l'entreprise.
    const { ticket_id, entreprise_id } = req.body;

    if (!ticket_id || !entreprise_id) {
      return res.status(400).json({ error: "Les paramètres 'ticket_id' et 'entreprise_id' sont requis." });
    }

    // 3. Créer la nouvelle mission dans la table 'missions'
    const { data: missionData, error: missionError } = await supabase
      .from('missions')
      .insert({
        ticket_id: ticket_id,
        entreprise_id: entreprise_id,
        statut: 'acceptée', // ou 'en attente d'assignation' si vous préférez
        date_acceptation: new Date().toISOString(), // Correction de la faute de frappe
        // technicien_id reste NULL par défaut
      })
      .select()
      .single();

    if (missionError) {
      console.error('Erreur Supabase (création mission):', missionError);
      return res.status(500).json({ error: 'Erreur lors de la création de la mission.' });
    }

    // 4. Mettre à jour le statut du ticket original dans la table 'tickets'
    const { error: ticketError } = await supabase
      .from('tickets')
      .update({ statut: 'en cours' }) // Le statut du ticket passe à "en cours"
      .eq('id', ticket_id);

    if (ticketError) {
      // Important : si cette étape échoue, il faudrait idéalement annuler la création de la mission
      // pour éviter les données incohérentes. Pour l'instant, on se contente de logguer l'erreur.
      console.error('Erreur Supabase (MAJ ticket):', ticketError);
      return res.status(500).json({ error: 'La mission a été créée, mais erreur lors de la mise à jour du ticket.' });
    }

    // 5. Tout s'est bien passé, on renvoie une réponse de succès.
    res.status(200).json({ message: 'Mission créée et ticket mis à jour.', mission: missionData });

  } catch (e) {
    console.error('Erreur inattendue:', e);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};