// locataire.js

console.log("Espace locataire chargé ✓");

// Soumission du formulaire de ticket
const form = document.getElementById("ticket-form");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = document.getElementById("category").value;
    const room = document.getElementById("room").value;
    const urgency = document.getElementById("urgency").value;
    const description = document.getElementById("description").value.trim();

    console.log("NOUVEAU TICKET LOCATAIRE ►", {
      category,
      room,
      urgency,
      description
    });

    // Ici, plus tard :
    // fetch("/api/tickets/create", { method: "POST", body: JSON.stringify(...)})

    alert(
      "Votre demande d’intervention a été enregistrée.\n" +
      "Pour l’instant, c’est une simulation (pas encore connecté à l’API)."
    );

    form.reset();
  });
}

// Déconnexion (simple redirection pour le moment)
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    window.location.href = "/login.html";
  });
}
