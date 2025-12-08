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

  const priorite = (ticket.priorite || "P4").toUpperCase();
  const categorie = ticket.categorie || "Non défini";
  const piece = ticket.piece || "";
  const ville = ticket.ville || "Non précisée";
  const budget = formatBudget(ticket.budget_plafond);
  const disponibilites = buildDispoList(ticket);

  if (disponibilites.uniqueSlot) {
    card.dataset.uniqueDispo = disponibilites.uniqueSlot.raw;
  }

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
      ${disponibilites.html}
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
  const selectDispo = card.querySelector(".mission-select-dispo");
  const userId = localStorage.getItem("userId");

  if (!userId) {
    alert("Session expirée. Veuillez vous reconnecter.");
    window.location.href = "/login.html";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Acceptation...";

  try {
    let disponibiliteSelectionnee = null;

    if (selectDispo) {
      disponibiliteSelectionnee = selectDispo.value;

      if (!disponibiliteSelectionnee) {
        btn.disabled = false;
        btn.textContent = "Accepter la mission";
        alert("Merci de choisir une disponibilité avant de continuer.");
        return;
      }
    } else if (card.dataset.uniqueDispo) {
      disponibiliteSelectionnee = card.dataset.uniqueDispo;
    }

    const response = await fetch("/api/entreprise/missions/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId,
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        disponibilite: disponibiliteSelectionnee,
      }),
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

function formatBudget(value) {
  if (value === null || value === undefined) {
    return "Aucun";
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    return value;
  }

  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(number);
}

function buildDispoList(ticket) {
  const slots = [ticket.dispo1, ticket.dispo2, ticket.dispo3]
    .filter(Boolean)
    .map((raw) => ({ raw, formatted: formatDateTime(raw) }));

  if (slots.length === 0) {
    return {
      html: '<div class="info-row"><span>🗓️ Disponibilité</span><span>Non renseignée</span></div>',
      uniqueSlot: null,
    };
  }

  if (slots.length === 1) {
    return {
      html: `<div class="info-row"><span>🗓️ Disponibilité</span><span>${slots[0].formatted}</span></div>`,
      uniqueSlot: slots[0],
    };
  }

  const options = slots
    .map(({ raw, formatted }) => `<option value="${raw}">${formatted}</option>`)
    .join("");

  const selectHtml = `
    <label class="info-row selectable-dispo">
      <span>🗓️ Disponibilités</span>
      <select class="mission-select-dispo">
        <option value="">— Choisir —</option>
        ${options}
      </select>
    </label>
  `;

  return {
    html: selectHtml,
    uniqueSlot: null,
  };
}

function formatDateTime(value) {
  if (!value) return "Non renseignée";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-CH", {
    dateStyle: "long",
    timeStyle: "short",
  });
}
