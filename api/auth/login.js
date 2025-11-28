import { supabaseServer } from "../supabase.js";
import cookie from "cookie";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  const { data, error } = await supabaseServer.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return res.status(400).json({ error: "Email ou mot de passe incorrect" });
  }

  const access_token = data.session.access_token;

  res.setHeader(
    "Set-Cookie",
    cookie.serialize("access_token", access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  );

  return res.status(200).json({
    success: true,
    user: data.user,
  });
}
