import { supabaseServer } from "../../utils/supabaseClient.js";

const ROLE_OPTIONS = ["regie", "entreprise", "technicien", "locataire"];

async function resolveDefaultContext(role, regieId, entrepriseId) {
  let resolvedRegieId = regieId || null;
  let resolvedEntrepriseId = entrepriseId || null;

  if (!resolvedRegieId && ["regie", "locataire"].includes(role)) {
    const { data } = await supabaseServer.from("regie").select("id").limit(1).single();
    resolvedRegieId = data?.id || null;
  }

  if (!resolvedEntrepriseId && ["entreprise", "technicien"].includes(role)) {
    const { data } = await supabaseServer
      .from("entreprises")
      .select("id")
      .limit(1)
      .single();
    resolvedEntrepriseId = data?.id || null;
  }

  return { resolvedRegieId, resolvedEntrepriseId };
}

export default async function devCreateUserHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password, role, regieId = null, entrepriseId = null } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({ error: "email, password et role sont requis" });
  }

  const normalizedRole = role.toLowerCase().trim();
  if (!ROLE_OPTIONS.includes(normalizedRole)) {
    return res.status(400).json({ error: "Rôle invalide" });
  }

  try {
    const { data: createdUser, error: createUserError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError) {
      console.error("Erreur création utilisateur test", createUserError);
      return res.status(400).json({ error: createUserError.message });
    }

    const userId = createdUser?.user?.id;
    if (!userId) {
      return res.status(500).json({ error: "Utilisateur créé sans identifiant" });
    }

    const { resolvedRegieId, resolvedEntrepriseId } = await resolveDefaultContext(
      normalizedRole,
      regieId,
      entrepriseId,
    );

    const profilePayload = {
      id: userId,
      role: normalizedRole,
      regie_id: resolvedRegieId,
      entreprise_id: resolvedEntrepriseId,
    };

    const { error: profileError } = await supabaseServer.from("profiles").upsert(profilePayload);
    if (profileError) {
      console.error("Erreur insertion profil test", profileError);
      return res.status(500).json({ error: "Profil non créé" });
    }

    return res.status(201).json({
      success: true,
      userId,
      email,
      role: normalizedRole,
      regieId: resolvedRegieId,
      entrepriseId: resolvedEntrepriseId,
    });
  } catch (error) {
    console.error("Erreur devCreateUserHandler", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
