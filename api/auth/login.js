import { supabase } from "../utils/supabaseClient.js";

export default async function handler(req, res) {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(400).json({ error: "Email ou mot de passe incorrect" });
  }

  return res.status(200).json({ success: true });
}
