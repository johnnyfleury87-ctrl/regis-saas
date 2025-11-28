document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#login-form");
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        console.log("Email envoyé :", email);
        console.log("Password envoyé :", password);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await res.json();
            console.log("Réponse API :", result);

            if (result.success) {
                // REDIRECTION APRÈS LOGIN
                window.location.href = "/dashboard.html";
            } else {
                alert(result.error || "Identifiants incorrects");
            }

        } catch (err) {
            console.error("Erreur réseau :", err);
            alert("Erreur serveur. Réessaie plus tard.");
        }
    });
});
document.getElementById("dev-access").addEventListener("click", () => {
    alert("Mode développeur actif : accès direct.");
    window.location.href = "/dashboard.html";
});
