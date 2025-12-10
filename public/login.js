document.addEventListener("DOMContentLoaded", () => {
  console.log("Login.js chargé ✓");

  const loginForm = document.getElementById("login-form");
  const devButton = document.getElementById("dev-access");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        // 1. Appel à votre API (cette partie est déjà correcte)
        const response = await fetch("/api/auth", {
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
        if (result.entrepriseId) {
          localStorage.setItem("entrepriseId", result.entrepriseId);
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

  if (devButton) {
    devButton.addEventListener("click", async () => {
      const email = prompt("Email du nouvel utilisateur de test ?");
      if (!email) {
        return;
      }

      const password = prompt("Mot de passe temporaire ? (min. 6 caractères)");
      if (!password) {
        return;
      }

      const role = (prompt("Rôle (regie, entreprise, technicien, locataire) ?") || "")
        .trim()
        .toLowerCase();
      if (!role) {
        alert("Rôle requis");
        return;
      }

      try {
        const response = await fetch("/api/dev/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Création impossible");
        }

        document.getElementById("email").value = email;
        document.getElementById("password").value = password;
        alert(`Utilisateur ${role} créé. Utilise ces identifiants pour te connecter.`);
      } catch (error) {
        console.error("Erreur création utilisateur test:", error);
        alert(`Création impossible: ${error.message}`);
      }
    });
  }
});