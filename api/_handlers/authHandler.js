import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

/**
 * Fonction pour lire le corps JSON d'une requête.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<object>}
 */
async function getJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); } 
            catch (e) { reject(e); }
        });
    });
}

// --- Logique pour chaque action ---

async function login(req, res) {
    try {
        const { email, password } = await getJsonBody(req);
        if (!email || !password) {
            return res.status(400).json({ error: "Email ou mot de passe manquant." });
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return res.status(401).json({ error: error.message });
        return res.status(200).json({ session: data.session });

    } catch (e) {
        console.error("Erreur dans la fonction login:", e);
        return res.status(500).json({ error: "Erreur interne du serveur." });
    }
}

async function logout(req, res) {
    await supabase.auth.signOut();
    return res.status(200).json({ message: "Déconnexion réussie" });
}

async function getUser(req, res) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    return res.status(200).json(user);
}

// --- Handler principal qui route vers la bonne fonction ---

export default async function handleAuth(req, res) {
    // CORRECTION : On ne garde que la partie de l'URL avant le '?'
    const cleanUrl = req.url.split('?')[0]; 
    const urlParts = cleanUrl.split('/');
    const action = urlParts[urlParts.length - 1];

    switch(action) {
        case 'login':
            if (req.method === 'POST') return login(req, res);
            break;
        case 'logout':
            if (req.method === 'POST') return logout(req, res);
            break;
        case 'user':
            if (req.method === 'GET') return getUser(req, res);
            break;
        default:
            // Si l'action n'est pas reconnue
            return res.status(404).json({ error: `Action d'authentification non reconnue: '${action}'` });
    }
    
    // Si la méthode HTTP n'est pas la bonne
    return res.status(405).json({ error: `Méthode ${req.method} non autorisée pour /api/auth/${action}` });
}