// Import direct depuis CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://mkcjwhkcqfjgaoqjbmsy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rY2p3aGtjcWZqZ2Fxb2pibXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDg4ODMsImV4cCI6MjA3OTYyNDg4M30.XANf4CpYvG8U1S_9OGuIPPK_NkvfmwrT0XHfVTpOIdY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("error");

    errorMsg.textContent = "";

    if (!email || !password) {
        errorMsg.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    try {
        console.log("🔐 Tentative de connexion...");

        // 1. Connexion Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error("❌ Erreur authentification:", authError);
            
            // Messages d'erreur en français
            if (authError.message.includes("Invalid login credentials")) {
                errorMsg.textContent = "Identifiants incorrects. Vérifiez votre email et mot de passe.";
            } else if (authError.message.includes("Email not confirmed")) {
                errorMsg.textContent = "Email non confirmé. Vérifiez votre boîte mail.";
            } else if (authError.message.includes("Failed to fetch")) {
                errorMsg.textContent = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
            } else {
                errorMsg.textContent = "Erreur de connexion : " + authError.message;
            }
            return;
        }

        console.log("✅ Authentification réussie:", authData.user.email);

        // 2. Récupération du profil
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, regie_id, entreprise_id')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error("❌ Erreur récupération profil:", profileError);
            errorMsg.textContent = "Profil utilisateur introuvable. Contactez l'administrateur.";
            return;
        }

        console.log("✅ Profil récupéré:", profile);

        // 3. Redirection selon le rôle
        switch (profile.role) {
            case 'regie':
                window.location.href = '/app/pages/regie/index.html';
                break;
            case 'entreprise':
                window.location.href = '/dashboard.html?role=entreprise';
                break;
            case 'locataire':
                window.location.href = '/dashboard.html?role=locataire';
                break;
            case 'technicien':
                window.location.href = '/dashboard.html?role=technicien';
                break;
            default:
                errorMsg.textContent = "Rôle utilisateur non reconnu.";
        }

    } catch (err) {
        console.error("❌ Erreur inattendue:", err);
        errorMsg.textContent = "Erreur de connexion au serveur. Réessayez plus tard.";
    }
});
