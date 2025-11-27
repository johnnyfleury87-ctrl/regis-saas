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

        // Appel au backend (sécurisé)
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent = data.error || "Erreur lors de la connexion.";
            return;
        }

        console.log("✅ Connexion backend réussie");

        // Maintenant on récupère le rôle via une autre route backend
        const roleRes = await fetch("/api/auth/profile");
        const roleData = await roleRes.json();

        if (!roleRes.ok) {
            errorMsg.textContent = roleData.error || "Impossible de récupérer le profil.";
            return;
        }

        console.log("👤 Profil récupéré :", roleData);

        // Redirection selon le rôle
        switch (roleData.role) {
            case "regie":
                window.location.href = "/app/pages/regie/index.html";
                break;
            case "entreprise":
                window.location.href = "/dashboard.html?role=entreprise";
                break;
            case "locataire":
                window.location.href = "/dashboard.html?role=locataire";
                break;
            case "technicien":
                window.location.href = "/dashboard.html?role=technicien";
                break;
            default:
                errorMsg.textContent = "Rôle utilisateur inconnu.";
        }

    } catch (err) {
        console.error("❌ Erreur inattendue :", err);
        errorMsg.textContent = "Impossible de contacter le serveur.";
    }
});
