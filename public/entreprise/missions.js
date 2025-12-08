const uiState = {
  actifsContainer: null,
  actifsEmpty: null,
  disponiblesContainer: null,
  disponiblesEmpty: null,
  userId: null,
};

document.addEventListener("DOMContentLoaded", () => {
  uiState.actifsContainer = document.getElementById("missions-actives");
  uiState.actifsEmpty = document.getElementById("missions-actives-empty");
  uiState.disponiblesContainer = document.getElementById("missions-disponibles");
  uiState.disponiblesEmpty = document.getElementById("missions-disponibles-empty");

  uiState.userId = localStorage.getItem("userId");

  if (!uiState.userId) {
    alert("Session expirée. Merci de vous reconnecter.");
    window.location.href = "/login.html";
    return;
  }

  loadMissions();
});

async function loadMissions() {
  if (!uiState.disponiblesContainer || !uiState.actifsContainer) {
    console.error("Conteneurs missions introuvables dans le DOM.");
    return;
  }

  uiState.disponiblesContainer.innerHTML = "<p>Chargement…</p>";
  uiState.actifsContainer.innerHTML = "<p>Chargement…</p>";

  try {
    const response = await fetch("/api/entreprise/missions", {
      headers: { "X-User-Id": uiState.userId },
    });

    if (!response.ok) {
      throw new Error("Erreur lors du chargement des missions.");
    }

    const payload = await response.json();
    const disponibles = Array.isArray(payload.disponibles) ? payload.disponibles : [];
    const missionsActives = Array.isArray(payload.missionsActives) ? payload.missionsActives : [];

    renderDisponibles(disponibles);
    renderActives(missionsActives);
  } catch (error) {
    console.error("Chargement missions entreprise échoué:", error);
    uiState.disponiblesContainer.innerHTML = "<p>Erreur de chargement des missions disponibles.</p>";
    uiState.actifsContainer.innerHTML = "<p>Erreur de chargement des missions en cours.</p>";
  }
}

function renderDisponibles(tickets) {
  const container = uiState.disponiblesContainer;
  const empty = uiState.disponiblesEmpty;

  container.innerHTML = "";

  if (!tickets || tickets.length === 0) {
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  tickets.forEach((ticket) => {
    const card = buildDisponibleCard(ticket);
    container.appendChild(card);
  });
}

function renderActives(missions) {
  const container = uiState.actifsContainer;
  const empty = uiState.actifsEmpty;

  container.innerHTML = "";

  if (!missions || missions.length === 0) {
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  missions.forEach((mission) => {
    const card = buildActiveMissionCard(mission);
    container.appendChild(card);
  });
}

function buildDisponibleCard(ticket) {
  const card = document.createElement("article");
  card.className = "mission-card";
  card.id = `ticket-${ticket.id}`;

  const priorite = (ticket.priorite || "P4").toUpperCase();
  const categorie = escapeHtml(ticket.categorie || "Mission");
  const piece = escapeHtml(ticket.piece || "");
  const ville = escapeHtml(ticket.ville || "Non précisée");
  const budget = formatBudget(ticket.budget_plafond);
  const disponibilites = buildDispoList(ticket);

  if (disponibilites.uniqueSlot) {
    card.dataset.uniqueDispo = disponibilites.uniqueSlot.raw;
  }

  card.innerHTML = `
    <header class="mission-card-header">
      <div>
        <h2>${categorie}${piece ? " · " + piece : ""}</h2>
        <span class="mission-id">Ticket #${escapeHtml(ticket.id.substring(0, 8))}</span>
      </div>
      <span class="priority-badge priority-${priorite.toLowerCase()}">${priorite}</span>
    </header>
    <div class="mission-card-body">
      <div class="info-row"><span>📍 Ville</span><span>${ville}</span></div>
      <div class="info-row"><span>💰 Budget plafond</span><span>${budget}</span></div>
      ${disponibilites.html}
    </div>
    <footer class="mission-card-footer">
      <button class="btn btn-primary" data-ticket="${ticket.id}">Accepter la mission</button>
    </footer>
  `;

  const actionBtn = card.querySelector("button[data-ticket]");
  actionBtn.addEventListener("click", () => accepterMission(ticket.id, card, actionBtn));

  return card;
}

function buildActiveMissionCard(mission) {
  const card = document.createElement("article");
  card.className = "mission-card";
  card.id = `mission-${mission.id}`;

  const ticket = mission.ticket || {};
  const locataire = mission.locataire || {};
  const statut = mission.statut || "en_attente";
  const missionStatusLabel = formatStatus(statut);
  const missionClosed = isMissionCloturee(statut);

  const adresse = locataire.address || ticket.adresse || "Adresse non communiquée";
  const ville = locataire.city || ticket.ville || "";
  const infosAdresse = [escapeHtml(adresse), escapeHtml(ville)].filter(Boolean).join(" · ");

  const intervention = mission.date_intervention ? formatDateTime(mission.date_intervention) : "À planifier";
  const accepteLe = mission.date_acceptation ? formatDateTime(mission.date_acceptation) : "En attente";

  card.innerHTML = `
    <header class="mission-card-header">
      <div>
        <h2>${escapeHtml(ticket.categorie || "Mission")}${ticket.piece ? " · " + escapeHtml(ticket.piece) : ""}</h2>
        <div class="mission-meta">
          <span class="mission-id">Mission #${escapeHtml(mission.id.substring(0, 8))}</span>
          <span class="mission-status-badge">${missionStatusLabel}</span>
        </div>
      </div>
    </header>
    <div class="mission-card-body">
      <div class="info-row"><span>🗓️ Intervention</span><span>${escapeHtml(intervention)}</span></div>
      <div class="info-row"><span>✅ Acceptée le</span><span>${escapeHtml(accepteLe)}</span></div>
      <div class="info-row"><span>📍 Intervention</span><span>${infosAdresse || "-"}</span></div>
      <div class="info-row"><span>📝 Description</span><span>${escapeHtml(ticket.detail || ticket.description || "")}</span></div>
    </div>
    ${renderLocataireBloc(locataire)}
    <footer class="mission-card-footer">
      <a class="btn btn-secondary" href="mission-details.html?id=${mission.id}">Voir la mission</a>
      <button class="btn btn-primary" data-complete="${mission.id}" ${missionClosed ? "disabled" : ""}>
        ${missionClosed ? "Mission clôturée" : "Mission terminée"}
      </button>
    </footer>
  `;

  const completeBtn = card.querySelector("button[data-complete]");
  if (completeBtn && !missionClosed) {
    completeBtn.addEventListener("click", () => updateMissionStatus(mission.id, "terminée", completeBtn));
  }

  return card;
}

function renderLocataireBloc(locataire) {
  if (!locataire) {
    return "";
  }

  const nom = [locataire.prenom, locataire.nom].filter(Boolean).join(" ") || "Non communiqué";
  const phone = locataire.phone || "Non communiqué";
  const email = locataire.email || "Non communiqué";
  const digicode = locataire.building_code || "-";
  const appartement = locataire.apartment || "-";

  return `
    <div class="mission-locataire">
      <h3>Coordonnées locataire</h3>
      <div class="info-row"><span>👤 Nom</span><span>${escapeHtml(nom)}</span></div>
      <div class="info-row"><span>📞 Téléphone</span><span>${escapeHtml(phone)}</span></div>
      <div class="info-row"><span>✉️ Email</span><span>${escapeHtml(email)}</span></div>
      <div class="info-row"><span>🔐 Digicode</span><span>${escapeHtml(digicode)}</span></div>
      <div class="info-row"><span>🏢 Appartement</span><span>${escapeHtml(appartement)}</span></div>
    </div>
  `;
}

async function accepterMission(ticketId, card, button) {
  button.disabled = true;
  button.textContent = "Acceptation…";

  try {
    const selectDispo = card.querySelector(".mission-select-dispo");
    let disponibiliteSelectionnee = null;

    if (selectDispo) {
      disponibiliteSelectionnee = selectDispo.value;
      if (!disponibiliteSelectionnee) {
        button.disabled = false;
        button.textContent = "Accepter la mission";
        alert("Merci de sélectionner une disponibilité avant de continuer.");
        return;
      }
    } else if (card.dataset.uniqueDispo) {
      disponibiliteSelectionnee = card.dataset.uniqueDispo;
    }

    const response = await fetch("/api/entreprise/missions/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": uiState.userId,
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        disponibilite: disponibiliteSelectionnee,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Acceptation impossible");
    }

    button.textContent = "Mission acceptée ✔";
    card.style.opacity = 0.6;
    await loadMissions();
  } catch (error) {
    console.error("Acceptation mission échouée:", error);
    alert("Erreur : " + error.message);
    button.disabled = false;
    button.textContent = "Accepter la mission";
  }
}

async function updateMissionStatus(missionId, newStatus, button) {
  button.disabled = true;
  button.textContent = "Mise à jour…";

  try {
    const response = await fetch("/api/entreprise/missions/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": uiState.userId,
      },
      body: JSON.stringify({ mission_id: missionId, new_status: newStatus }),
    });

    const output = await response.json();
    if (!response.ok) {
      throw new Error(output.error || "Mise à jour impossible");
    }

    await loadMissions();
  } catch (error) {
    console.error("Mise à jour statut mission échouée:", error);
    alert("Erreur : " + error.message);
    button.disabled = false;
    button.textContent = "Mission terminée";
  }
}

function formatBudget(value) {
  if (value === null || value === undefined || value === "") {
    return "Non communiqué";
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    return escapeHtml(String(value));
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
    return escapeHtml(String(value));
  }

  return date.toLocaleString("fr-CH", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatStatus(status) {
  const map = {
    "en_attente": "En attente",
    "en attente": "En attente",
    "acceptée": "Acceptée",
    "acceptee": "Acceptée",
    "planifiée": "Planifiée",
    "planifiee": "Planifiée",
    "en_cours": "En cours",
    "en cours": "En cours",
    "terminée": "Terminée",
    "terminee": "Terminée",
  };

  const key = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return map[key] || status;
}

function isMissionCloturee(status) {
  const normalised = (status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ["terminee", "annulee", "cloturee", "archivee"].includes(normalised);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
