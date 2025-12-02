import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

// Logique de l'ancien api/auth/login.js
async function login(req, res) {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(401).json({ error: error.message });
    return res.status(200).json({ session: data.session });
}

// Logique de l'ancien api/auth/logout.js
async function logout(req, res) {
    await supabase.auth.signOut();
    return res.status(200).json({ message: "Déconnexion réussie" });
}

// Logique de l'ancien api/auth/user.js
async function getUser(req, res) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    return res.status(200).json(user);
}

// Ce handler principal va choisir la bonne fonction en fonction de l'URL
export default async function handleAuth(req, res) {
    const action = req.url.split('/').pop(); // 'login', 'logout', ou 'user'

    switch(action) {
        case 'login':
            return login(req, res);
        case 'logout':
            return logout(req, res);
        case 'user':
            return getUser(req, res);
        default:
            return res.status(404).json({ error: 'Action d\'authentification non trouvée' });
    }
}