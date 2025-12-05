// NOTE: Le client Supabase est importé sans "Server" car ce fichier utilise "admin"
import { supabaseServer as supabase } from "../../utils/supabaseClient.js";


export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { regieId } = req.query;
      if (!regieId) return res.status(400).json({ error: "regieId manquant" });
      const { data, error } = await supabase.from("locataires_details").select("*").eq("regie_id", regieId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ locataires: data });
    }

    if (req.method === "POST") {
      const { regieId, prenom, nom, email, adresse, loyer, password } = req.body;
      if (!regieId || !email || !password) return res.status(400).json({ error: "Champs obligatoires manquants" });
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (authError) return res.status(500).json({ error: authError.message });
      const userId = authUser.user.id;
      await supabase.from("profiles").insert({ id: userId, role: "locataire", regie_id: regieId });
      await supabase.from("locataires_details").insert({ user_id: userId, prenom, nom, email, address: adresse, zip_code: null, city: null, loyer, regie_id: regieId });
      return res.status(201).json({ success: true });
    }

    // Ajoutez ici la logique pour PUT, DELETE, PATCH de votre fichier `locataires.js`
    
    return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}