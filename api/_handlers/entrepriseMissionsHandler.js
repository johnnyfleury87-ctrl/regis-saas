import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

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
        // 👇 CORRECTION ICI : Ajout de 'detail', 'description', et les autres 'dispo'
        .select(`id, categorie, piece, detail, description, ville, dispo1, dispo2, dispo3, priorite, budget_plafond, created_at`)
        .eq("statut", "publie") // Uniquement les missions publiées
        .is("entreprise_id", null) // Et qui n'ont pas encore été acceptées par une autre entreprise
        .order("created_at", { ascending: false });
  
      if (error) throw error;
  
      return res.status(200).json({ missions: data });

    } catch (err) {
      console.error("Erreur dans handleEntrepriseMissions (GET):", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // --- CAS N°2 : Accepter une mission (PATCH) ---
  else if (req.method === 'PATCH') {
    try {
      const { missionId } = req.body;
      
      // IMPORTANT : Récupérer l'ID de l'entreprise connectée.
      // Cette ligne suppose que vous avez un système d'authentification qui rend l'ID de l'entreprise
      // disponible. Si votre méthode est différente, il faudra l'adapter ici.
      const entrepriseId = req.entreprise?.id || 'd159a639-8581-429a-8069-b5863483951f'; // ID de l'entreprise à remplacer par la vraie valeur de la session

      if (!missionId) {
        return res.status(400).json({ error: "L'ID de la mission est manquant." });
      }
      if (!entrepriseId) {
        return res.status(401).json({ error: "Utilisateur non authentifié ou ID d'entreprise non trouvé." });
      }

      // On met à jour le ticket dans la base de données
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          statut: 'en_cours',      // Changement du statut
          entreprise_id: entrepriseId // Assignation à l'entreprise actuelle
        })
        .eq('id', missionId)       // Pour le bon ticket
        .eq('statut', 'publie')    // Sécurité : on s'assure qu'on ne peut accepter qu'une mission encore "publiée"
        .select()
        .single(); // .single() est utile pour s'assurer qu'une seule ligne a été modifiée

      if (error) throw error;
      
      // Si `data` est null, cela signifie qu'aucune ligne n'a été modifiée (peut-être déjà acceptée par un autre)
      if (!data) {
          return res.status(409).json({ error: "Cette mission n'est plus disponible ou a déjà été acceptée." });
      }

      console.log(`Mission ${missionId} acceptée par l'entreprise ${entrepriseId}`);
      return res.status(200).json({ message: 'Mission acceptée avec succès !', mission: data });

    } catch (err) {
      console.error("Erreur dans handleEntrepriseMissions (PATCH):", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // --- Si la méthode n'est ni GET ni PATCH ---
  else {
    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}