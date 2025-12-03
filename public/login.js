document.addEventListener("DOMContentLoaded", () => {
  console.log("Login.js chargé ✓");

  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        // 1. Appel à votre API (cette partie est déjà correcte)
        const response = await fetch("/api/authHandler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Erreur d'authentification");
        }
        
        // --- DÉBUT DE LA CORRECTION ---

        // 2. Stockage des informations essentielles pour les autres pages
        localStorage.clear(); // On nettoie les anciennes sessions
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("role", result.role);
        if (result.regieId) {
          localStorage.setItem("regieId", result.regieId);
        }

        // 3. Implémentation de la logique de redirection dynamique
        console.log("Redirection pour le rôle :", result.role); // Pour déboguer

        switch (result.role) {
          case "regie":
            if (result.regieId) {
              // Redirige vers la vue régie avec son ID dans l'URL
              window.location.href = `/regie/index.html?regieId=${result.regieId}`;
            } else {
              alert("Erreur de configuration : ID de régie manquant.");
            }
            break;

          case "locataire":
            // Redirige correctement vers la vue locataire
            window.location.href = "/locataire/index.html";
            break;
          
          case "entreprise":
            window.location.href = "/entreprise/index.html";
            break;

          case "technicien":
            window.location.href = "/technicien/index.html";
            break;

          default:
            // Si le rôle est inconnu, redirige vers une page par défaut
            alert("Rôle utilisateur non reconnu. Redirection vers la page d'accueil.");
            window.location.href = "/";
            break;
        }

        // --- FIN DE LA CORRECTION ---

      } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        alert(`Erreur: ${error.message}`);
      }
    });
  }
});