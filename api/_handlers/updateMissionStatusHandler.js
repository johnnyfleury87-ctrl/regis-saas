// Importe le client Supabase partagé
import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function updateMissionStatusHandler(req, res) {
  // On s'assure que la méthode est bien POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // On récupère l'ID de la mission et le nouveau statut depuis le corps de la requête
    const { mission_id, new_status } = req.body;

    // Validation simple
    if (!mission_id || !new_status) {
      return res.status(400).json({ error: 'Les paramètres mission_id et new_status sont requis' });
    }

    // On met à jour la mission dans Supabase
    const { data, error } = await supabase
      .from('missions')
      .update({ 
        statut: new_status,
        // Si le statut est 'acceptée', on met à jour la date d'acceptation
        ...(new_status === 'acceptée' && { date_acceptation: new Date().toISOString() })
      })
      .eq('id', mission_id)
      .select() // Demande à Supabase de renvoyer la ligne mise à jour
      .single();

    if (error) {
      // Si Supabase renvoie une erreur, on la log et on la renvoie au client
      console.error('Erreur Supabase:', error);
      return res.status(500).json({
        error: 'Erreur lors de la mise à jour de la mission.',
        details: error.message,
      });
    }

    // Si tout va bien, on renvoie une réponse de succès avec la mission mise à jour
    res.status(200).json({ message: 'Statut de la mission mis à jour.', mission: data });

  } catch (e) {
    // Gestion des erreurs imprévues
    console.error('Erreur inattendue:', e);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}