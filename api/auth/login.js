import { supabase } from "../utils/supabaseClient.js";

export default async function handler(req, res) {
  // Lire correctement le body sur Vercel
  const body = await req.json();
  const { email, password } = body;

  // Vérifier présence email / password
  if (!email || !password) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(400).json({ error: "Email ou mot de passe incorrect" });
  }

  return res.status(200).json({ success: true });
}
