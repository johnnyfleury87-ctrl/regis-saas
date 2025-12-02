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
    const res = await fetch("/api/index.", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const rawText = await res.text();
    let data = null;

    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("Réponse non JSON:", rawText);
      alert("Erreur serveur. Réessaye plus tard.");
      return;
    }

    if (!res.ok || !data?.success) {
      alert(data?.error || "Identifiants incorrects.");
      return;
    }

    // Stockage pour les pages suivantes (AJOUT ICI)
    localStorage.setItem("role", data.role);

    if (data.regieId) localStorage.setItem("regieId", data.regieId);

    if (data.userId) localStorage.setItem("userId", data.userId);  // <-- INDISPENSABLE
    else console.warn("⚠️ Pas de userId reçu depuis le backend !");

    // Redirection selon le rôle
    switch (data.role) {
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
        window.location.href = "/dashboard.html";
        break;
    }

  } catch (err) {
    console.error("Erreur JS:", err);
    alert("Impossible de contacter le serveur.");
  }
});

// Bouton debug
document.getElementById("dev-access").addEventListener("click", () => {
  window.location.href = "/dashboard.html";
});
