// On garde votre import, il est parfait.
import { supabaseServer as supabase } from "../../utils/supabaseClient.js";

// On exporte directement LA fonction qui gère la connexion.
export default async function handleLogin(req, res) {
    
    // On vérifie que la méthode est bien POST.
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Méthode non autorisée. Seul POST est accepté.' });
    }

    try {
        // Le body de la requête est déjà parsé par Vercel, pas besoin de le lire manuellement.
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: "Email ou mot de passe manquant." });
        }
        
        // On se connecte avec Supabase.
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.error("Erreur Supabase signIn:", error.message);
            return res.status(401).json({ success: false, error: error.message });
        }

        // --- Succès ---
        // On doit renvoyer les informations dont le client a besoin (rôle, etc.)
        // Cette partie est un exemple, car je ne sais pas où le rôle est stocké.
        const role = data.user?.user_metadata?.role || 'locataire'; // A adapter !

        return res.status(200).json({ 
            success: true,
            role: role,
            userId: data.user.id,
            regieId: data.user?.user_metadata?.regie_id || null // A adapter !
        });

    } catch (e) {
        console.error("Erreur critique dans le handler de login:", e);
        return res.status(500).json({ success: false, error: "Erreur interne du serveur." });
    }
}