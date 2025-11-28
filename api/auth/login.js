import supabase from "../supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, password")
    .eq("email", email)
    .eq("password", password)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: "Identifiants incorrects" });
  }

  return res.json({
    success: true,
    role: data.role,
    userId: data.id
  });
}
