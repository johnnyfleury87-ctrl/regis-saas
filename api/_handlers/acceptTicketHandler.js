import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function acceptTicketHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { ticket_id, disponibilite } = req.body;
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!ticket_id) {
      return res.status(400).json({
        error: "Le paramètre 'ticket_id' est requis.",
      });
    }

    // Identifier l'entreprise liée à l'utilisateur connecté
    const { data: profil, error: profilError } = await supabase
      .from("profiles")
      .select("entreprise_id")
      .eq("id", userId)
      .single();

    if (profilError || !profil?.entreprise_id) {
      return res.status(400).json({
        error: "Impossible de déterminer l'entreprise associée à cet utilisateur.",
      });
    }

    const entreprise_id = profil.entreprise_id;

    // 1. Vérifier que le ticket est toujours dispo
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("id, statut, entreprise_id, dispo1, dispo2, dispo3")
      .eq("id", ticket_id)
      .single();

    if (fetchError) {
      console.error("Erreur récupération ticket:", fetchError);
      return res
        .status(500)
        .json({ error: "Impossible de récupérer le ticket." });
    }

    if (ticket.statut !== "publie" || ticket.entreprise_id !== null) {
      return res.status(409).json({
        error: "Ce ticket n'est plus disponible.",
      });
    }

    const disponibilites = [ticket.dispo1, ticket.dispo2, ticket.dispo3].filter(Boolean);
    const hasMultipleSlots = disponibilites.length > 1;
    const slotChoisi = disponibilite || disponibilites[0] || null;

    if (hasMultipleSlots && !disponibilite) {
      return res.status(400).json({
        error: "Merci de sélectionner une disponibilité parmi les choix proposés.",
      });
    }

    // 2. Mettre à jour le ticket → en_cours + entreprise_id
    const { data: updatedTicket, error: updateError } = await supabase
      .from("tickets")
      .update({
        statut: "en_cours",
        entreprise_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket_id)
      .eq("statut", "publie")
      .is("entreprise_id", null)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur MAJ ticket:", updateError);
      return res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du ticket." });
    }

    // 3. Créer la mission liée
    const slotDate = slotChoisi ? new Date(slotChoisi) : null;
    const dateIntervention = slotDate && !Number.isNaN(slotDate.getTime())
      ? slotDate.toISOString()
      : null;

    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .insert({
        ticket_id,
        entreprise_id,
        statut: "en_cours",
        date_acceptation: new Date().toISOString(),
        date_intervention: dateIntervention,
      })
      .select()
      .single();

    if (missionError) {
      console.error("Erreur création mission:", missionError);
      return res.status(500).json({
        error: "Ticket mis à jour mais erreur lors de la création de la mission.",
      });
    }

    return res.status(200).json({
      message: "Mission créée et ticket assigné.",
      ticket: updatedTicket,
      mission,
    });
  } catch (e) {
    console.error("Erreur inattendue dans acceptTicketHandler:", e);
    return res.status(500).json({ error: "Erreur serveur interne." });
  }
}
