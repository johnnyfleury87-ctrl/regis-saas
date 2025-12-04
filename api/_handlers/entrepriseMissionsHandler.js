import { supabaseServer as supabase } from '../../utils/supabase.js'; // <-- CORRECTION FINALE ICI : supabaseClient.js -> supabase.js

/**
 * Ce handler gère deux cas :
 * 1. GET /api/entreprise/missions : Récupère la liste des missions publiées.
 * 2. PATCH /api/entreprise/missions : Met à jour une mission pour l'accepter (passe le statut à 'en_cours').
 */
export default async function handleEntrepriseMissions(req, res) {
  
  // --- CAS N°1 : Récupérer la liste des missions (GET) ---
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`id, categorie, piece, detail, description, ville, dispo1, dispo2, dispo3, priorite, budget_plafond, created_at`)
        .eq("statut", "publie")
        .is("entreprise_id", null)
        .order("created_at", { ascending: false });
  
      if (error) {
        console.error("Erreur Supabase dans handleEntrepriseMissions (GET):", error);
        throw error;
      }
  
      return res.status(200).json({ missions: data });

    } catch (err) {
      console.error("Erreur dans handleEntrepriseMissions (GET):", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // --- CAS N°2 : Accepter une mission (PATCH) ---
  else if (req.method === 'PATCH') {
    try {
      const { missionId } = req.body;
      const entrepriseId = req.entreprise?.id || 'd159a639-8581-429a-8069-b5863483951f';

      if (!missionId) {
        return res.status(400).json({ error: "L'ID de la mission est manquant." });
      }
      if (!entrepriseId) {
        return res.status(401).json({ error: "Utilisateur non authentifié ou ID d'entreprise non trouvé." });
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

      if (error) {
        console.error("Erreur Supabase dans handleEntrepriseMissions (PATCH):", error);
        throw error;
      }
      
      if (!data) {
          return res.status(409).json({ error: "Cette mission n'est plus disponible ou a déjà été acceptée." });
      }

      console.log(`Mission ${missionId} acceptée par l'entreprise ${entrepriseId}`);
      return res.status(200).json({ message: 'Mission acceptée avec succès !', mission: data });

    } catch (err) {
      console.error("Erreur dans handleEntrepriseMissions (PATCH):", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // --- Si la méthode n'est ni GET ni PATCH ---
  else {
    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}