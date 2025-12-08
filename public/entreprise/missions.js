document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page des tickets disponibles initialisée.");

  const missionsContainer = document.getElementById("missions-container");
  const emptyState = document.getElementById("empty-state");

  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("Utilisateur non identifié – redirection login.");
      window.location.href = "/login.html";
      return;
    }

    // APPEL SERVEUR → on transmet l'identifiant utilisateur pour lier le profil
    const response = await fetch("/api/entreprise/missions", {
      headers: {
        "X-User-Id": userId,
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors du chargement des missions.");
    }

    const { missions } = await response.json();

    if (!missions || missions.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    missionsContainer.innerHTML = "";

    missions.forEach(ticket => {
      const card = createMissionCard(ticket);
      missionsContainer.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    missionsContainer.innerHTML = "<p>Erreur de chargement des missions.</p>";
  }
});

function createMissionCard(ticket) {
  const card = document.createElement("article");
  card.className = "mission-card";
  card.id = `ticket-${ticket.id}`;

  const priorite = ticket.priorite || "P4";
  const categorie = ticket.categorie || "Non défini";
  const piece = ticket.piece || "";
  const ville = ticket.ville || "Non précisée";
  const budget = ticket.budget_plafo ? `${ticket.budget_plafo} CHF` : "Aucun";
  const dispo = ticket.dispo1 || "Non renseignée";

  card.innerHTML = `
    <header class="mission-card-header">
      <div>
        <h2>${categorie} : ${piece}</h2>
        <span class="mission-id">TICKET #${ticket.id.substring(0,8)}</span>
      </div>
      <span class="priority-badge priority-${priorite.toLowerCase()}">${priorite}</span>
    </header>
    
    <div class="mission-card-body">
      <div class="info-row"><span>📍 Ville</span><span>${ville}</span></div>
      <div class="info-row"><span>💰 Budget Plafond</span><span>${budget}</span></div>
      <div class="info-row"><span>🗓️ Disponibilité</span><span>${dispo}</span></div>
    </div>

    <footer class="mission-card-footer">
      <button class="btn btn-primary" onclick="accepterMission('${ticket.id}')">
        Accepter la mission
      </button>
    </footer>
  `;

  return card;
}

async function accepterMission(ticketId) {
  const card = document.getElementById(`ticket-${ticketId}`);
  const btn = card.querySelector("button");

  btn.disabled = true;
  btn.textContent = "Acceptation...";

  try {
    const response = await fetch("/api/entreprise/missions/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: ticketId })
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error);

    btn.textContent = "Acceptée ✔";
    btn.disabled = true;
    card.style.opacity = 0.4;

  } catch (err) {
    console.error(err);
    alert("Erreur : " + err.message);
    btn.disabled = false;
    btn.textContent = "Accepter la mission";
  }
}
