import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

function normaliseDateToIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatDateForNotification(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildNotificationMessage(formattedDate) {
  if (formattedDate) {
    return `Votre disponibilité du ${formattedDate} a été validée, un technicien est envoyé.`;
  }
  return "Votre intervention a été confirmée, un technicien est envoyé.";
}

function buildOrdreMissionPayload({ ticket, entreprise, slotIso, disponibiliteSelectionnee, userId }) {
  return {
    reference_ticket: ticket.id,
    genere_le: new Date().toISOString(),
    genere_par: userId,
    rendez_vous: {
      date_iso: slotIso,
      disponibilite_choisie: disponibiliteSelectionnee,
      propositions: [ticket.dispo1, ticket.dispo2, ticket.dispo3].filter(Boolean),
    },
    entreprise: {
      id: entreprise.id,
      name: entreprise.name || null,
      contact_email: entreprise.contact_email || null,
      contact_phone: entreprise.contact_phone || null,
      address: entreprise.address || null,
      ville: entreprise.ville || null,
      npa: entreprise.npa || null,
    },
    ticket: {
      categorie: ticket.categorie,
      piece: ticket.piece,
      description: ticket.description,
      detail: ticket.detail,
      priorite: ticket.priorite,
      adresse: ticket.adresse,
      ville: ticket.ville,
      budget_plafond: ticket.budget_plafond,
    },
    locataire: {
      id: ticket.locataire_id,
    },
  };
}

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

    const { data: entreprise, error: entrepriseError } = await supabase
      .from("entreprises")
      .select("id, regie_id, name, contact_email, contact_phone, address, ville, npa")
      .eq("id", entreprise_id)
      .single();

    if (entrepriseError || !entreprise?.regie_id) {
      return res.status(400).json({
        error: "Entreprise introuvable ou non rattachée à une régie.",
      });
    }

    // 1. Vérifier que le ticket est toujours dispo
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("id, statut, entreprise_id, dispo1, dispo2, dispo3, locataire_id, regie_id")
      .eq("id", ticket_id)
      .single();

    if (fetchError) {
      console.error("Erreur récupération ticket:", fetchError);
      return res
        .status(500)
        .json({ error: "Impossible de récupérer le ticket." });
    }

    if (!ticket.locataire_id || !ticket.regie_id) {
      return res.status(400).json({
        error: "Ticket invalide: locataire ou régie manquant.",
      });
    }

    if (ticket.regie_id !== entreprise.regie_id) {
      return res.status(403).json({
        error: "Cette entreprise n'est pas autorisée pour la régie du ticket.",
      });
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
    const dateIntervention = normaliseDateToIso(slotChoisi);
    const ordrePayload = buildOrdreMissionPayload({
      ticket,
      entreprise,
      slotIso: dateIntervention,
      disponibiliteSelectionnee: slotChoisi,
      userId,
    });

    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .insert({
        ticket_id,
        entreprise_id,
        regie_id: ticket.regie_id,
        locataire_id: ticket.locataire_id,
        statut: "planifiee",
        date_acceptation: new Date().toISOString(),
        date_intervention: dateIntervention,
        ordre_mission_payload: ordrePayload,
      })
      .select()
      .single();

    if (missionError) {
      console.error("Erreur création mission:", missionError);
      return res.status(500).json({
        error: "Ticket mis à jour mais erreur lors de la création de la mission.",
      });
    }

    if (ticket.locataire_id) {
      const formattedDate = formatDateForNotification(dateIntervention || slotChoisi);
      const message = buildNotificationMessage(formattedDate);
      const { error: notificationError } = await supabase
        .from("locataire_notifications")
        .insert({
          locataire_id: ticket.locataire_id,
          ticket_id: ticket.id,
          mission_id: mission.id,
          type: "mission_planifiee",
          title: "Intervention confirmée",
          message,
          channel: "in_app",
          payload: {
            mission_id: mission.id,
            ticket_id: ticket.id,
            entreprise: {
              id: entreprise.id,
              name: entreprise.name,
            },
            date_intervention: dateIntervention,
            disponibilite_source: slotChoisi,
          },
        });

      if (notificationError) {
        console.error("Notification locataire non envoyée:", notificationError);
      }
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
