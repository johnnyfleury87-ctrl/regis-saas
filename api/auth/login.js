import { supabaseServer } from "../../supabase.js";
console.log("Requête reçue :", req.body);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  const { data, error } = await supabaseServer.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  return res.json({
    success: true,
    user: data.user,
    session: data.session
  });
}
