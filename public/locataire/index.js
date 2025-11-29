console.log("locataire/index.js chargé ✓");

// Vérifier si utilisateur connecté
const userId = localStorage.getItem("userId");
if (!userId) {
  alert("Session expirée. Merci de vous reconnecter.");
  window.location.href = "/login.html";
}

// Sélecteurs DOM
const userNameSpan = document.getElementById("locataire-name");
const addressCard = document.getElementById("locataire-address");
const loyerCard = document.getElementById("locataire-loyer");
const ticketsContainer = document.getElementById("locataire-tickets");

// Déconnexion
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

// Charger profil + détails logement
async function loadLocataire() {
  try {
    const res = await fetch(`/api/locataires/tickets?userId=${userId}`);

    const data = await res.json();

    if (!res.ok) {
      console.error("Erreur profil :", data);
      alert("Impossible de charger vos informations.");
      return;
    }

    const profil = data.profil;
    const details = data.details;

    // Nom affiché
    userNameSpan.textContent = profil.display_name || "Locataire";

    // Adresse logement
    addressCard.innerHTML = `
      <li>🏠 ${details.address || "-"}</li>
      <li>${details.zip_code || "-"} ${details.city || "-"}</li>
      <li>Appartement : ${details.apartment || "-"}</li>
      <li>Bâtiment : ${details.building_code || "-"}</li>
    `;

    // Loyer
    loyerCard.innerHTML = `
      <li>💰 Loyer mensuel : ${details.loyer || "-"} CHF</li>
      <li>📅 Prochain paiement : 01.12.2025</li>
    `;
  } catch (err) {
    console.error("Erreur loadLocataire()", err);
  }
}

// Charger les tickets du locataire
async function loadTickets() {
  try {
    const res = await fetch(`/api/locataire/tickets?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Erreur tickets :", data);
      ticketsContainer.innerHTML = "<p>Impossible de charger les tickets.</p>";
      return;
    }

    const tickets = data.tickets || [];

    ticketsContainer.innerHTML = "";

    if (tickets.length === 0) {
      ticketsContainer.innerHTML = "<p>Aucun ticket pour le moment.</p>";
      return;
    }

    for (const t of tickets) {
      const div = document.createElement("div");
      div.className = "ticket-row";

      div.innerHTML = `
        <div class="ticket-main">
          <span class="ticket-label">${t.category || ""} – ${t.description?.slice(0, 40) || ""}</span>
          <span class="ticket-meta">Créé le ${t.created_at.split("T")[0]}</span>
        </div>
        <span class="ticket-status ${t.status === "done" ? "done" : "open"}">
          ${t.status === "done" ? "Terminé" : "En cours"}
        </span>
      `;

      ticketsContainer.appendChild(div);
    }
  } catch (err) {
    console.error("Erreur loadTickets()", err);
  }
}

// Charger page
loadLocataire();
loadTickets();
