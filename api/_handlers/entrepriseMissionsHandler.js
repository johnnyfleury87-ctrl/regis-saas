import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function entrepriseMissionsHandler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // 2️⃣ RÉCUPÉRER LE PROFIL (PERMET D'OBTENIR entreprise_id)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("entreprise_id, regie_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Erreur récupération profil entreprise:", profileError);
      return res.status(500).json({ error: "Impossible de récupérer le profil utilisateur." });
    }

    let entrepriseId = profile?.entreprise_id || null;
    let regieId = profile?.regie_id || null;

    if (!entrepriseId) {
      const { data: technicien, error: technicienError } = await supabase
        .from("entreprise_techniciens")
        .select("entreprise_id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (technicienError) {
        console.error("Erreur récupération technicien entreprise:", technicienError);
      }

      if (technicien?.entreprise_id) {
        entrepriseId = technicien.entreprise_id;
      }
    }

    if (!entrepriseId) {
      return res.status(400).json({ error: "Aucune entreprise associée à cet utilisateur." });
    }

    // 3️⃣ RÉCUPÉRER LA RÉGIE ASSOCIÉE
    const { data: entreprise, error: entError } = await supabase
      .from("entreprises")
      .select("regie_id, name")
      .eq("id", entrepriseId)
      .single();

    if (entError || !entreprise) {
      return res.status(400).json({ error: "Impossible de récupérer la régie" });
    }

    regieId = regieId || entreprise.regie_id;

    if (!regieId) {
      return res.status(400).json({ error: "Aucune régie associée à l'entreprise." });
    }

    // 4️⃣ RÉCUPÉRER LES TICKETS PUBLIÉS POUR CETTE RÉGIE
    const { data: tickets, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("regie_id", regieId)
      .eq("statut", "publie");

    if (ticketError) throw ticketError;

    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select("id, ticket_id, statut, date_acceptation, date_intervention, commentaire, created_at")
      .eq("entreprise_id", entrepriseId)
      .order("created_at", { ascending: false });

    if (missionsError) throw missionsError;

    const missionTicketIds = (missions || [])
      .map((mission) => mission.ticket_id)
      .filter(Boolean);

    let missionTickets = [];
    if (missionTicketIds.length > 0) {
      const { data: fetchedTickets, error: fetchedTicketsError } = await supabase
        .from("tickets")
        .select("*")
        .in("id", missionTicketIds);

      if (fetchedTicketsError) throw fetchedTicketsError;
      missionTickets = fetchedTickets || [];
    }

    const locataireIds = missionTickets
      .map((ticket) => ticket.locataire_id)
      .filter(Boolean);

    let locataires = [];
    if (locataireIds.length > 0) {
      const { data: locataireRows, error: locatairesError } = await supabase
        .from("locataires_details")
        .select("user_id, prenom, nom, email, phone, address, zip_code, city, building_code, apartment")
        .in("user_id", locataireIds);

      if (locatairesError) throw locatairesError;
      locataires = locataireRows || [];
    }

    const CLOSED_STATUSES = new Set(["terminee", "terminée", "annulee", "annulée", "cloturee", "clôturée", "archivee", "archivée"]);

    const missionsActives = (missions || [])
      .filter((mission) => {
        const normalised = (mission.statut || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return !CLOSED_STATUSES.has(normalised);
      })
      .map((mission) => {
        const ticket = missionTickets.find((t) => t.id === mission.ticket_id) || null;
        const locataire = ticket
          ? locataires.find((loc) => loc.user_id === ticket.locataire_id) || null
          : null;

        return {
          ...mission,
          ticket,
          locataire,
          entreprise: {
            id: entrepriseId,
            name: entreprise?.name || null,
          },
        };
      });

    return res.status(200).json({
      disponibles: tickets || [],
      missionsActives,
    });

  } catch (err) {
    console.error("Erreur entrepriseMissionsHandler:", err);
    return res.status(500).json({ error: "Erreur interne serveur." });
  }
}
