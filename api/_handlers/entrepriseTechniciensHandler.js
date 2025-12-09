import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

async function getEntrepriseContext(userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("entreprise_id, regie_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.entreprise_id) {
    return { error: "Entreprise introuvable pour cet utilisateur." };
  }

  return {
    entrepriseId: profile.entreprise_id,
    regieId: profile.regie_id || null,
  };
}

function normaliseCompetences(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw.map((item) => `${item}`.trim()).filter(Boolean);
  }

  return `${raw}`
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function handleGet(req, res, entrepriseId) {
  const { data, error } = await supabase
    .from("entreprise_techniciens")
    .select(
      `id, profile_id, poste, competences, telephone, email, statut, is_active, created_at, updated_at,
       profile:profiles(id, display_name)`
    )
    .eq("entreprise_id", entrepriseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur récupération techniciens:", error);
    return res.status(500).json({ error: "Impossible de récupérer les techniciens." });
  }

  const techniciens = (data || []).map((row) => ({
    id: row.id,
    profile_id: row.profile_id,
    nom: row?.profile?.display_name || null,
    poste: row.poste,
    competences: row.competences || [],
    telephone: row.telephone,
    email: row.email,
    statut: row.statut,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return res.status(200).json({ techniciens });
}

async function handlePost(req, res, contexte) {
  const {
    email,
    password,
    nom,
    poste,
    telephone,
    competences,
    statut = "disponible",
  } = req.body || {};

  if (!email || !password || !nom) {
    return res.status(400).json({
      error: "Champs requis manquants : email, mot de passe et nom sont obligatoires.",
    });
  }

  const competencesArray = normaliseCompetences(competences);

  try {
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Erreur création utilisateur technicien:", createError);
      return res.status(400).json({ error: createError.message || "Création du compte technicien impossible." });
    }

    const technicienUser = userData.user;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: technicienUser.id,
      role: "technicien",
      regie_id: contexte.regieId,
      entreprise_id: contexte.entrepriseId,
      display_name: nom,
      phone: telephone || null,
      is_active: true,
    });

    if (profileError) {
      console.error("Erreur upsert profil technicien:", profileError);
      return res.status(500).json({ error: "Profil technicien introuvable ou non créé." });
    }

    let { data: updatedRow, error: updateTechError } = await supabase
      .from("entreprise_techniciens")
      .update({
        poste: poste || null,
        telephone: telephone || null,
        email,
        competences: competencesArray ?? [],
        statut,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", technicienUser.id)
      .select(
        `id, profile_id, poste, competences, telephone, email, statut, is_active, created_at, updated_at,
         profile:profiles(id, display_name)`
      )
      .single();

    if (updateTechError || !updatedRow) {
      if (updateTechError && updateTechError.code !== "PGRST116") {
        console.error("Erreur mise à jour technicien entreprise après trigger:", updateTechError);
      }

      const { data: insertedRow, error: insertFallbackError } = await supabase
        .from("entreprise_techniciens")
        .insert({
          profile_id: technicienUser.id,
          entreprise_id: contexte.entrepriseId,
          poste: poste || null,
          telephone: telephone || null,
          email,
          competences: competencesArray ?? [],
          statut,
          is_active: true,
        })
        .select(
          `id, profile_id, poste, competences, telephone, email, statut, is_active, created_at, updated_at,
           profile:profiles(id, display_name)`
        )
        .single();

      if (insertFallbackError) {
        console.error("Erreur fallback insertion technicien entreprise:", insertFallbackError);
        return res.status(500).json({ error: "Technicien créé mais impossible de finaliser les informations." });
      }

      updatedRow = insertedRow;
    }

    const technicien = {
      id: updatedRow.id,
      profile_id: updatedRow.profile_id,
      nom: updatedRow?.profile?.display_name || nom,
      poste: updatedRow.poste,
      competences: updatedRow.competences || [],
      telephone: updatedRow.telephone,
      email: updatedRow.email,
      statut: updatedRow.statut,
      is_active: updatedRow.is_active,
      created_at: updatedRow.created_at,
      updated_at: updatedRow.updated_at,
    };

    return res.status(201).json({ technicien });
  } catch (err) {
    console.error("Erreur POST technicien:", err);
    return res.status(500).json({ error: "Erreur interne lors de la création du technicien." });
  }
}

async function handlePut(req, res, contexte) {
  const {
    technicien_id,
    poste,
    telephone,
    competences,
    statut,
    is_active,
    nom,
    email,
  } = req.body || {};

  if (!technicien_id) {
    return res.status(400).json({ error: "L'identifiant du technicien est requis." });
  }

  try {
    const { data: actuel, error: fetchError } = await supabase
      .from("entreprise_techniciens")
      .select("id, profile_id, entreprise_id")
      .eq("id", technicien_id)
      .single();

    if (fetchError || !actuel) {
      return res.status(404).json({ error: "Technicien introuvable." });
    }

    if (actuel.entreprise_id !== contexte.entrepriseId) {
      return res.status(403).json({ error: "Technicien non rattaché à votre entreprise." });
    }

    const competencesArray = normaliseCompetences(competences);

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (typeof poste !== "undefined") updatePayload.poste = poste || null;
    if (typeof telephone !== "undefined") updatePayload.telephone = telephone || null;
    if (typeof statut !== "undefined") updatePayload.statut = statut;
    if (typeof is_active === "boolean") updatePayload.is_active = is_active;
    if (typeof email !== "undefined") updatePayload.email = email || null;
    if (typeof competences !== "undefined") updatePayload.competences = competencesArray || [];

    const { error: updateTechError } = await supabase
      .from("entreprise_techniciens")
      .update(updatePayload)
      .eq("id", technicien_id);

    if (updateTechError) {
      console.error("Erreur update technicien:", updateTechError);
      return res.status(500).json({ error: "Impossible de mettre à jour le technicien." });
    }

    if (nom || email) {
      const updateProfilePayload = {};
      if (nom) updateProfilePayload.display_name = nom;
      if (typeof is_active === "boolean") updateProfilePayload.is_active = is_active;
      if (typeof telephone !== "undefined") updateProfilePayload.phone = telephone || null;

      if (Object.keys(updateProfilePayload).length > 0) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update(updateProfilePayload)
          .eq("id", actuel.profile_id);

        if (profileUpdateError) {
          console.error("Erreur mise à jour profil technicien:", profileUpdateError);
          return res.status(500).json({ error: "Mise à jour du profil technicien impossible." });
        }
      }

      if (email) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(actuel.profile_id, {
          email,
        });

        if (authUpdateError) {
          console.error("Erreur mise à jour email auth:", authUpdateError);
          return res.status(500).json({ error: "Mise à jour de l'email impossible." });
        }
      }
    }

    const { data: refreshed, error: refreshError } = await supabase
      .from("entreprise_techniciens")
      .select(
        `id, profile_id, poste, competences, telephone, email, statut, is_active, created_at, updated_at,
         profile:profiles(id, display_name)`
      )
      .eq("id", technicien_id)
      .single();

    if (refreshError) {
      console.error("Erreur récupération technicien maj:", refreshError);
      return res.status(500).json({ error: "Technicien mis à jour, mais lecture impossible." });
    }

    return res.status(200).json({
      technicien: {
        id: refreshed.id,
        profile_id: refreshed.profile_id,
        nom: refreshed?.profile?.display_name || null,
        poste: refreshed.poste,
        competences: refreshed.competences || [],
        telephone: refreshed.telephone,
        email: refreshed.email,
        statut: refreshed.statut,
        is_active: refreshed.is_active,
        created_at: refreshed.created_at,
        updated_at: refreshed.updated_at,
      },
    });
  } catch (err) {
    console.error("Erreur PUT technicien:", err);
    return res.status(500).json({ error: "Erreur interne lors de la mise à jour du technicien." });
  }
}

async function handleDelete(req, res, contexte) {
  const { technicien_id } = req.body || {};

  if (!technicien_id) {
    return res.status(400).json({ error: "L'identifiant du technicien est requis." });
  }

  try {
    const { data: actuel, error: fetchError } = await supabase
      .from("entreprise_techniciens")
      .select("id, entreprise_id, is_active, profile_id")
      .eq("id", technicien_id)
      .single();

    if (fetchError || !actuel) {
      return res.status(404).json({ error: "Technicien introuvable." });
    }

    if (actuel.entreprise_id !== contexte.entrepriseId) {
      return res.status(403).json({ error: "Technicien non rattaché à votre entreprise." });
    }

    if (!actuel.is_active) {
      return res.status(200).json({ success: true });
    }

    const { error: updateError } = await supabase
      .from("entreprise_techniciens")
      .update({ is_active: false, statut: "inactif", updated_at: new Date().toISOString() })
      .eq("id", technicien_id);

    if (updateError) {
      console.error("Erreur désactivation technicien:", updateError);
      return res.status(500).json({ error: "Impossible de désactiver le technicien." });
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", actuel.profile_id);

    if (profileUpdateError) {
      console.warn("Technicien désactivé, mais profil non mis à jour:", profileUpdateError);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur DELETE technicien:", err);
    return res.status(500).json({ error: "Erreur interne lors de la désactivation du technicien." });
  }
}

export default async function entrepriseTechniciensHandler(req, res) {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  const contexte = await getEntrepriseContext(userId);
  if (contexte.error) {
    return res.status(403).json({ error: contexte.error });
  }

  switch (req.method) {
    case "GET":
      return handleGet(req, res, contexte.entrepriseId);
    case "POST":
      return handlePost(req, res, contexte);
    case "PUT":
      return handlePut(req, res, contexte);
    case "DELETE":
      return handleDelete(req, res, contexte);
    default:
      return res.status(405).json({ error: "Méthode non autorisée" });
  }
}
