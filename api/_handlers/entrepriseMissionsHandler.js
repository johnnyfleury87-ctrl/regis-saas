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
        .select(`id, categorie, piece, detail, description, ville, dispo1, dispo2, dispo3, priorite, budget_plafond, created_at`)
        .eq("statut", "publie")
        .is("entreprise_id", null)
        .order("created_at", { ascending: false });
  
      // Si Supabase renvoie une erreur, on la lance pour qu'elle soit attrapée par le bloc catch.
      if (error) throw new Error(error.message);
  
      return res.status(200).json({ missions: data });

    } else if (req.method === 'PATCH') {
      const { missionId } = req.body;
      // Remarque : l'ID de l'entreprise devrait venir de la session de l'utilisateur authentifié.
      // Le hardcoder est une mauvaise pratique et une faille de sécurité.
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

      // Si Supabase renvoie une erreur, on la lance.
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
    // Ce bloc 'catch' centralisé gère maintenant toutes les erreurs.
    console.error(`Erreur dans handleEntrepriseMissions (${req.method}):`, err.message);
    return res.status(500).json({ error: err.message });
  }
} 