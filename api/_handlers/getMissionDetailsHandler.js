// On importe le client Supabase qui se trouve bien à la racine du projet
import { supabaseServer as supabase } from "../../utils/supabaseClient.js";


export default async function getMissionDetailsHandler(req, res) {
  // On s'assure que la méthode est GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // L'ID vient maintenant des paramètres de l'URL (?id=...)
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Le paramètre id est manquant' });
    }

    // --- On récupère la mission et le ticket associé ---
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('*, tickets(*)')
      .eq('id', id)
      .single();

    if (missionError) throw missionError;

    let locataireDetails = null;
    // --- Si la mission est acceptée, on va chercher les infos du locataire ---
    if (mission.tickets?.locataire_id) {
      const { data: locataireData, error: locataireError } = await supabase
        .from('locataires_details')
        .select('*')
        .eq('id', mission.tickets.locataire_id)
        .single();
      
      if (locataireError) {
        // On ne bloque pas tout si le locataire n'est pas trouvé, on log juste l'erreur
        console.error("Erreur lors de la récupération des détails du locataire:", locataireError);
      } else {
        locataireDetails = locataireData;
      }
    }

    // On combine toutes les infos dans une seule réponse
    const responsePayload = {
      ...mission,
      locataire_details: locataireDetails
    };

    res.status(200).json(responsePayload);

  } catch (error) {
    console.error('Erreur dans getMissionDetailsHandler:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}