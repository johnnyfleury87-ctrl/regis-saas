import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

export default async function entrepriseMissionsHandler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { entrepriseId } = req.query;
    if (!entrepriseId) {
      return res
        .status(400)
        .json({ error: "Le paramètre 'entrepriseId' est requis." });
    }

    // 1. Récupérer les missions de cette entreprise + ticket associé
    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select("id, statut, ticket_id, created_at, date_accepta, tickets(*)")
      .eq("entreprise_id", entrepriseId)
      .order("created_at", { ascending: false });

    if (missionsError) throw missionsError;

    if (!missions || missions.length === 0) {
      return res.status(200).json({ missions: [] });
    }

    // 2. Récupérer les infos locataire associées
    const locataireIds = missions
      .map((m) => m.tickets?.locataire_id)
      .filter(Boolean);

    let locataires = [];
    if (locataireIds.length > 0) {
      const { data: locs, error: locError } = await supabase
        .from("locataires_details")
        .select("*")
        .in("user_id", locataireIds);

      if (locError) throw locError;
      locataires = locs || [];
    }

    const missionsFinales = missions.map((m) => {
      const t = m.tickets || {};
      const loc =
        locataires.find((l) => l.user_id === t.locataire_id) || {};

      return {
        id: m.id,
        statut: m.statut,
        created_at: m.created_at,
        date_accepta: m.date_accepta,
        ticket: {
          id: t.id,
          categorie: t.categorie,
          piece: t.piece,
          detail: t.detail,
          description: t.description,
          urgence: t.urgence,
          ville: t.ville,
          budget_plafo: t.budget_plafo,
          dispo1: t.dispo1,
          dispo2: t.dispo2,
          dispo3: t.dispo3,
        },
        locataire: {
          prenom: loc.prenom,
          nom: loc.nom,
          email: loc.email,
          phone: loc.phone,
          address: loc.address,
          zip_code: loc.zip_code,
          city: loc.city,
        },
      };
    });

    return res.status(200).json({ missions: missionsFinales });
  } catch (err) {
    console.error("Erreur dans entrepriseMissionsHandler:", err);
    return res
      .status(500)
      .json({ error: "Erreur interne du serveur (missions entreprise)." });
  }
}
