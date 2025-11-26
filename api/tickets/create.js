import { supabase } from "../utils/supabaseClient.js";

export default async function handler(req, res) {
  try {
    const body = req.body;

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        user_id: body.user_id,
        category: body.category,
        description: body.description,
        city: body.city
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
