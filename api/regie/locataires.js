import { supabase } from "../supabase.js";

export default async function handler(req, res) {
  const method = req.method;

  try {
    // =====================================================
    // GET — Liste des locataires de la régie
    // =====================================================
    if (method === "GET") {
      const regieId = req.query.regieId;
      if (!regieId)
        return res.status(400).json({ error: "regieId manquant" });

      const { data, error } = await supabase
        .from("locataires_details")
        .select("*")
        .eq("regie_id", regieId);

      if (error)
        return res.status(500).json({ error: error.message });

      return res.status(200).json({ locataires: data });
    }

    // =====================================================
    // POST — Créer un locataire
    // =====================================================
    if (method === "POST") {
      const { regieId, prenom, nom, email, adresse, loyer, password } = req.body;

      if (!regieId || !email || !password)
        return res.status(400).json({ error: "Champs obligatoires manquants" });

      // 1) Créer l’utilisateur dans AUTH
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

      if (authError)
        return res.status(500).json({ error: authError.message });

      const userId = authUser.user.id;

      // 2) Inscrire dans profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          role: "locataire",
          regie_id: regieId
        });

      if (profileError)
        return res.status(500).json({ error: profileError.message });

      // 3) Inscrire dans locataires_details
      const { error: detailsError } = await supabase
        .from("locataires_details")
        .insert({
          user_id: userId,
          prenom,
          nom,
          email,
          address: adresse,
          zip_code: null,
          city: null,
          loyer,
          regie_id: regieId
        });

      if (detailsError)
        return res.status(500).json({ error: detailsError.message });

      return res.status(201).json({ success: true });
    }

    // =====================================================
    // PUT — Modifier un locataire
    // =====================================================
    if (method === "PUT") {
      const { locataireId, prenom, nom, email, adresse, loyer } = req.body;

      if (!locataireId)
        return res.status(400).json({ error: "locataireId manquant" });

      const { error } = await supabase
        .from("locataires_details")
        .update({
          prenom,
          nom,
          email,
          address: adresse,
          loyer
        })
        .eq("user_id", locataireId);

      if (error)
        return res.status(500).json({ error: error.message });

      return res.status(200).json({ success: true });
    }

    // =====================================================
    // DELETE — Supprimer locataire
    // =====================================================
    if (method === "DELETE") {
      const { locataireId, userId } = req.body;

      if (!userId)
        return res.status(400).json({ error: "userId manquant" });

      // 1) Supprimer dans locataires_details
      await supabase
        .from("locataires_details")
        .delete()
        .eq("user_id", userId);

      // 2) Supprimer dans profiles
      await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      // 3) Supprimer compte AUTH
      await supabase.auth.admin.deleteUser(userId);

      return res.status(200).json({ success: true });
    }

    // =====================================================
    // PATCH — Import CSV en masse
    // =====================================================
    if (method === "PATCH") {
      const { regieId, locataires } = req.body;

      if (!regieId || !locataires)
        return res.status(400).json({ error: "Paramètres manquants" });

      for (const loc of locataires) {
        const { data: authUser } = await supabase.auth.admin.createUser({
          email: loc.email,
          password: loc.password,
          email_confirm: true
        });

        const userId = authUser.user.id;

        await supabase.from("profiles").insert({
          id: userId,
          role: "locataire",
          regie_id: regieId
        });

        await supabase.from("locataires_details").insert({
          user_id: userId,
          prenom: loc.prenom || null,
          nom: loc.nom || null,
          email: loc.email,
          address: loc.adresse || null,
          zip_code: null,
          city: null,
          loyer: loc.loyer || null,
          regie_id: regieId
        });
      }

      return res.status(200).json({ success: true });
    }

    // =====================================================
    // Méthode non supportée
    // =====================================================
    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
