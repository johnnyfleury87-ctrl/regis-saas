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
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent = data.error || "Erreur inconnue.";
            return;
        }

        // Succès → redirection
        window.location.href = "/dashboard.html";

    } catch (err) {
        errorMsg.textContent = "Erreur de connexion au serveur.";
        console.error(err);
    }
});
