import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function handleRegieTickets(req, res) {
  try {
    const { regieId } = req.query; // Récupère le regieId s'il existe

    // On prépare la requête de base vers la table 'tickets'
    let query = supabase.from("tickets").select("*");

    // --- LOGIQUE AMÉLIORÉE ---
    if (regieId) {
      // CAS 1 : Si un regieId est fourni (pour la page de la régie)
      // On filtre les tickets par cet ID.
      query = query.eq("regie_id", regieId);
    } else {
      // CAS 2 : Si aucun regieId n'est fourni (pour la page des entreprises)
      // On filtre pour ne montrer que les tickets "en attente" qui sont des missions disponibles.
      query = query.eq("statut", "en_attente");
    }

    // On ajoute le tri et on exécute la requête construite dynamiquement
    const { data: tickets, error: errorTickets } = await query.order("created_at", { ascending: false });

    if (errorTickets) throw errorTickets;

    // Si aucun ticket n'est trouvé, on renvoie un tableau vide
    if (!tickets || tickets.length === 0) {
      return res.status(200).json({ tickets: [] });
    }
    
    // --- Le reste du code est identique, car il est bien écrit ---

    const locataireIds = tickets.map((t) => t.locataire_id);
    const { data: locataires, error: errorLoc } = await supabase
      .from("locataires_details")
      .select("*")
      .in("user_id", locataireIds);

    if (errorLoc) throw errorLoc;

    const ticketsFinal = tickets.map((t) => {
      const loc = locataires.find((l) => l.user_id === t.locataire_id) || {};
      return {
        // On s'assure de renvoyer l'id du ticket, crucial pour la suite !
        id: t.id, 
        // ... et toutes les autres informations
        categorie: t.categorie, piece: t.piece, detail: t.detail,
        description: t.description, dispo1: t.dispo1, dispo2: t.dispo2,
        dispo3: t.dispo3, priorite: t.priorite, statut: t.statut,
        created_at: t.created_at, 
        // J'ai vu dans le JS frontend que j'avais fait une faute de frappe, 
        // le nom correct est bien `budget_plafond` ici
        budget_plafond: t.budget_plafo, 
        locataire_prenom: loc.prenom, locataire_nom: loc.nom,
        locataire_email: loc.email, adresse: loc.address,
        zip_code: loc.zip_code, city: loc.city, phone: loc.phone,
      };
    });

    return res.status(200).json({ tickets: ticketsFinal });
  } catch (err) {
    console.error("Erreur dans handleRegieTickets:", err);
    return res.status(500).json({ error: err.message });
  }
}