import { supabaseServer as supabase } from '../../utils/supabaseClient.js';

/**
 * Ce handler gère deux cas :
 * 1. GET /api/entreprise/missions : Récupère la liste des missions publiées.
 * 2. PATCH /api/entreprise/missions : Met à jour une mission pour l'accepter.
 */
export default async function handleEntrepriseMissions(req, res) {
  try {
    if (req.method === 'GET') {
      
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id, categorie, piece, detail, description, dispo1, dispo2, dispo3, priorite, budget_plafond, created_at,
          locataires_details!inner ( city )
        `) // MODIFIÉ : Syntaxe de jointure explicite
        .eq("statut", "publie")
        .is("entreprise_id", null)
        .order("created_at", { ascending: false });
  
      if (error) throw new Error(error.message);

      const missions = data.map(mission => {
        const { locataires_details, ...restOfMission } = mission;
        return {
          ...restOfMission,
          ville: locataires_details?.city
        };
      });
  
      return res.status(200).json({ missions });

    } else if (req.method === 'PATCH') {
      // ... Le reste du code est inchangé ...
      const { missionId } = req.body;
      const entrepriseId = 'd159a639-8581-429a-8069-b5863483951f'; 

      if (!missionId) {
        return res.status(400).json({ error: "L'ID de la mission est manquant." });
      }

      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          statut: 'en_cours',
          entreprise_id: entrepriseId
        })
        .eq('id', missionId)
        .eq('statut', 'publie')
        .select()
        .single();

      if (error) throw new Error(error.message);
      
      if (!data) {
          return res.status(409).json({ error: "Cette mission n'est plus disponible ou a déjà été acceptée." });
      }

      console.log(`Mission ${missionId} acceptée par l'entreprise ${entrepriseId}`);
      return res.status(200).json({ message: 'Mission acceptée avec succès !', mission: data });

    } else {
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error(`Erreur dans handleEntrepriseMissions (${req.method}):`, err.message);
    return res.status(500).json({ error: err.message });
  }
}