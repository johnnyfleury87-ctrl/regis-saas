document.addEventListener("DOMContentLoaded", () => {
  console.log("Login.js chargé ✓");

  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = emailInput.value;
      const password = passwordInput.value;

      console.log("Email envoyé :", email);
      console.log("Password envoyé :", '********');

      try {
        // CORRECTION : Suppression du ":1" à la fin de l'URL
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur inconnue");
        }

        // Si la connexion réussit, on redirige vers le tableau de bord de la régie
        // Il faudra plus tard une logique pour rediriger vers le bon dashboard (régie, entreprise...)
        window.location.href = "/regie/tickets.html"; 

      } catch (error) {
        console.error("Réponse non JSON: A server error has occurred", error);
        alert(`Erreur: ${error.message}`);
      }
    });
  }
});