console.log("Login.js chargé ✓");

// Récupération du formulaire
const form = document.getElementById("login-form");

if (!form) {
    console.error("ERREUR: #login-form introuvable dans le DOM !");
}

// Soumission du formulaire
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    console.log("Email envoyé :", email);
    console.log("Password envoyé :", password ? "********" : "(vide)");

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Réponse API:", errorText);
            alert("Erreur serveur. Réessaye plus tard.");
            return;
        }

        const data = await res.json();
        console.log("DATA REÇUE :", data);

        if (!data || !data.success) {
            alert("Identifiants incorrects.");
            return;
        }

        // Récupération du rôle renvoyé par l'API
        const role = data.role;
        console.log("Rôle détecté :", role);

        // REDIRECTION SELON LE RÔLE
        switch (role) {
            case "regie":
                window.location.href = "/regie/index.html";
                break;

            case "technicien":
                window.location.href = "/technicien/index.html";
                break;

            case "locataire":
                window.location.href = "/locataire/index.html";
                break;

            case "entreprise":
                window.location.href = "/entreprise/index.html";
                break;

            default:
                window.location.href = "/dashboard.html"; // fallback
                break;
        }

    } catch (err) {
        console.error("Erreur JS:", err);
        alert("Impossible de contacter le serveur.");
    }
});


// === ACCÈS TEMPORAIRE DEV ===
// (Bouton : Nouvel utilisateur temporaire)
document.getElementById("dev-access").addEventListener("click", () => {
    window.location.href = "/dashboard.html";
});
