import { supabaseServer as supabase } from "../../utils/supabaseClient.js";


export default async function handler(req, res) {
  const method = req.method;

  try {
    if (method === "GET") {
      const regieId = req.query.regieId;
      if (!regieId) return res.status(400).json({ error: "regieId manquant" });

      const { data, error } = await supabase
        .from("locataires_details")
        .select("*")
        .eq("regie_id", regieId);

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ locataires: data });
    }

    if (method === "POST") {
      const { regieId, prenom, nom, email, adresse, loyer, password } = req.body;

      if (!regieId || !email || !password)
        return res.status(400).json({ error: "Champs obligatoires manquants" });

      // 1) créer l'utilisateur Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) return res.status(500).json({ error: authError.message });

      const userId = authUser.user.id;

      // 2) créer le profil
      await supabase.from("profiles").insert({
        id: userId,
        role: "locataire",
        regie_id: regieId
      });

      // 3) créer le détail logement
      const { error: detailsError } = await supabase
        .from("locataires_details")
        .insert({
          id: userId,
          prenom,
          nom,
          email,
          adresse,
          loyer,
          regie_id: regieId
        });

      if (detailsError) return res.status(500).json({ error: detailsError.message });

      return res.status(201).json({ success: true });
    }

    if (method === "PUT") {
      const { locataireId, prenom, nom, email, adresse, loyer } = req.body;

      const { error } = await supabase
        .from("locataires_details")
        .update({ prenom, nom, email, adresse, loyer })
        .eq("id", locataireId);

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ success: true });
    }

    if (method === "DELETE") {
      const { locataireId, userId } = req.body;

      // supprimer la table details
      await supabase.from("locataires_details").delete().eq("id", locataireId);

      // supprimer profil
      await supabase.from("profiles").delete().eq("id", locataireId);

      // supprimer utilisateur Auth
      await supabase.auth.admin.deleteUser(userId);

      return res.status(200).json({ success: true });
    }

    if (method === "PATCH") {
      const { regieId, locataires } = req.body;

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
          id: userId,
          prenom: loc.prenom || null,
          nom: loc.nom || null,
          email: loc.email,
          adresse: loc.adresse || null,
          loyer: loc.loyer || null,
          regie_id: regieId
        });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
