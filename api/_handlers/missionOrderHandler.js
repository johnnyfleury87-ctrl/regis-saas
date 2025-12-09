import PDFDocument from "pdfkit";
import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

async function getEntrepriseContext(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("entreprise_id")
    .eq("id", userId)
    .single();

  if (error || !data?.entreprise_id) {
    return { error: "Entreprise introuvable pour cet utilisateur." };
  }

  return { entrepriseId: data.entreprise_id };
}

function buildOrderPayload(mission, ticket, entreprise, locataire) {
  if (mission.ordre_mission_payload) {
    return mission.ordre_mission_payload;
  }

  return {
    mission_id: mission.id,
    ticket_id: ticket?.id || null,
    genere_le: new Date().toISOString(),
    entreprise: {
      id: entreprise?.id || mission.entreprise_id,
      name: entreprise?.name || null,
      contact_email: entreprise?.contact_email || null,
      contact_phone: entreprise?.contact_phone || null,
      address: entreprise?.address || null,
      ville: entreprise?.ville || null,
      npa: entreprise?.npa || null,
    },
    locataire: locataire
      ? {
          id: locataire.id,
          prenom: locataire.prenom,
          nom: locataire.nom,
          email: locataire.email,
          phone: locataire.phone,
          address: locataire.address,
          zip_code: locataire.zip_code,
          city: locataire.city,
          building_code: locataire.building_code,
          apartment: locataire.apartment,
        }
      : null,
    ticket: {
      categorie: ticket?.categorie,
      piece: ticket?.piece,
      detail: ticket?.detail,
      description: ticket?.description,
      priorite: ticket?.priorite,
      adresse: ticket?.adresse,
      ville: ticket?.ville,
      budget_plafond: ticket?.budget_plafond,
    },
    rendez_vous: {
      date_iso: mission.date_intervention,
      disponibilites: [ticket?.dispo1, ticket?.dispo2, ticket?.dispo3].filter(Boolean),
    },
  };
}

function writeSection(doc, title, pairs) {
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#111827").text(title, { underline: true });
  doc.moveDown(0.2);
  pairs
    .filter((pair) => pair && pair.value)
    .forEach((pair) => {
      doc.fontSize(10).fillColor("#1f2937").text(`${pair.label}: ${pair.value}`);
    });
}

function generatePdf(res, payload) {
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `ordre-mission-${payload.mission_id || payload.ticket_id || "mission"}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  doc.pipe(res);

  doc.fontSize(20).fillColor("#111827").text("Ordre de mission", { align: "center" });
  doc.moveDown();

  if (payload.rendez_vous?.date_iso) {
    doc
      .fontSize(12)
      .fillColor("#1f2937")
      .text(`Date d'intervention: ${new Date(payload.rendez_vous.date_iso).toLocaleString("fr-CH", {
        dateStyle: "full",
        timeStyle: "short",
      })}`);
  }

  doc.moveDown();

  writeSection(doc, "Entreprise", [
    { label: "Nom", value: payload.entreprise?.name },
    { label: "Adresse", value: payload.entreprise?.address },
    { label: "Contact", value: payload.entreprise?.contact_email || payload.entreprise?.contact_phone },
  ]);

  writeSection(doc, "Locataire", [
    { label: "Nom", value: payload.locataire ? `${payload.locataire.prenom || ""} ${payload.locataire.nom || ""}`.trim() : null },
    { label: "Adresse", value: payload.locataire?.address },
    { label: "Ville", value: payload.locataire ? `${payload.locataire.zip_code || ""} ${payload.locataire.city || ""}`.trim() : null },
    { label: "Contact", value: payload.locataire?.phone || payload.locataire?.email },
    { label: "Digicode", value: payload.locataire?.building_code },
    { label: "Appartement", value: payload.locataire?.apartment },
  ]);

  writeSection(doc, "Ticket", [
    { label: "Catégorie", value: payload.ticket?.categorie },
    { label: "Pièce", value: payload.ticket?.piece },
    { label: "Priorité", value: payload.ticket?.priorite },
    { label: "Budget plafond", value: payload.ticket?.budget_plafond ? `${payload.ticket.budget_plafond} CHF` : null },
  ]);

  if (payload.ticket?.description || payload.ticket?.detail) {
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#111827").text("Description");
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor("#1f2937").text(payload.ticket.description || payload.ticket.detail, {
      align: "left",
    });
  }

  doc.moveDown(1);
  doc.fontSize(9).fillColor("#6b7280").text("Document généré automatiquement depuis Regis-SaaS.", {
    align: "center",
  });

  doc.end();
}

export default async function missionOrderHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  const { id, format } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Le paramètre id est requis." });
  }

  const contexte = await getEntrepriseContext(userId);
  if (contexte.error) {
    return res.status(403).json({ error: contexte.error });
  }

  const { data: mission, error: missionError } = await supabase
    .from("missions")
    .select("*, tickets(*)")
    .or(`id.eq.${id},ticket_id.eq.${id}`)
    .single();

  if (missionError || !mission) {
    return res.status(404).json({ error: "Mission introuvable." });
  }

  if (mission.entreprise_id !== contexte.entrepriseId) {
    return res.status(403).json({ error: "Mission non rattachée à votre entreprise." });
  }

  const { data: entreprise, error: entrepriseError } = await supabase
    .from("entreprises")
    .select("*")
    .eq("id", mission.entreprise_id)
    .single();

  if (entrepriseError) {
    console.warn("Entreprise introuvable pour mission", mission.id, entrepriseError);
  }

  let locataireDetails = null;
  if (mission.tickets?.locataire_id) {
    const { data: locataireData, error: locataireError } = await supabase
      .from("locataires_details")
      .select("*")
      .eq("id", mission.tickets.locataire_id)
      .single();

    if (locataireError) {
      console.warn("Locataire introuvable pour mission", mission.id, locataireError);
    } else {
      locataireDetails = locataireData;
    }
  }

  const payload = buildOrderPayload(mission, mission.tickets, entreprise, locataireDetails);

  if (format === "json") {
    return res.status(200).json({ ordre: payload });
  }

  return generatePdf(res, payload);
}
