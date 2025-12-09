const techState = {
  userId: null,
  missions: [],
  selected: null,
};

const techDom = {};

document.addEventListener("DOMContentLoaded", () => {
  techDom.list = document.getElementById("missions-list");
  techDom.empty = document.getElementById("missions-empty");
  techDom.details = document.getElementById("mission-details");
  techDom.name = document.getElementById("technicien-name");

  techState.userId = localStorage.getItem("userId");
  const displayName = localStorage.getItem("displayName");

  if (techDom.name && displayName) {
    techDom.name.textContent = displayName;
  }

  if (!techState.userId) {
    alert("Session expirée. Merci de vous reconnecter.");
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login.html";
  });

  loadMissions();
});

async function loadMissions() {
  try {
    const response = await fetch("/api/technicien/missions", {
      headers: { "X-User-Id": techState.userId },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Impossible de récupérer vos missions.");
    }

    techState.missions = Array.isArray(payload.missions) ? payload.missions : [];
    renderMissions();
  } catch (error) {
    console.error("Chargement missions technicien échoué:", error);
    if (techDom.list) {
      techDom.list.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    }
  }
}

function renderMissions() {
  if (!techDom.list || !techDom.empty) return;

  techDom.list.innerHTML = "";

  if (!techState.missions.length) {
    techDom.empty.classList.remove("hidden");
    techDom.details.innerHTML = '<p class="hint">Aucune mission en cours.</p>';
    return;
  }

  techDom.empty.classList.add("hidden");

  techState.missions.forEach((item) => {
    const card = buildMissionCard(item);
    techDom.list.appendChild(card);
  });

  if (!techState.selected && techState.missions.length) {
    selectMission(techState.missions[0].mission_id);
  }
}

function buildMissionCard(assignation) {
  const mission = assignation.mission || {};
  const ticket = mission.ticket || {};
  const locataire = mission.locataire || {};

  const card = document.createElement("article");
  card.className = "mission-card";
  card.dataset.missionId = assignation.mission_id;

  if (techState.selected === assignation.mission_id) {
    card.classList.add("active");
  }

  card.innerHTML = `
    <header>
      <strong>${escapeHtml(ticket.categorie || "Mission")}${ticket.piece ? " · " + escapeHtml(ticket.piece) : ""}</strong>
    </header>
    <p class="mission-meta">
      ${escapeHtml(formatDateTime(mission.date_intervention || ticket.dispo1))} · ${escapeHtml(locataire.city || ticket.ville || "-")}
    </p>
  `;

  card.addEventListener("click", () => selectMission(assignation.mission_id));

  return card;
}

function selectMission(missionId) {
  techState.selected = missionId;
  document.querySelectorAll(".mission-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.missionId === missionId);
  });

  const current = techState.missions.find((item) => item.mission_id === missionId);
  if (!current) {
    techDom.details.innerHTML = '<p class="hint">Sélectionnez une mission pour voir les détails.</p>';
    return;
  }

  renderMissionDetails(current);
}

function renderMissionDetails(assignation) {
  if (!techDom.details) return;

  const mission = assignation.mission || {};
  const ticket = mission.ticket || {};
  const locataire = mission.locataire || {};

  techDom.details.innerHTML = `
    <h3>${escapeHtml(ticket.categorie || "Mission")}</h3>
    <p><strong>Date :</strong> ${escapeHtml(formatDateTime(mission.date_intervention || ticket.dispo1))}</p>
    <p><strong>Adresse :</strong> ${escapeHtml(locataire.address || ticket.adresse || "Non communiquée")}</p>
    <p><strong>Ville :</strong> ${escapeHtml(locataire.city || ticket.ville || "-")}</p>
    <p><strong>Locataire :</strong> ${escapeHtml(`${locataire.prenom || ""} ${locataire.nom || ""}`.trim() || "Non communiqué")}</p>
    <p><strong>Téléphone :</strong> ${escapeHtml(locataire.phone || "Non communiqué")}</p>
    <p><strong>Digicode :</strong> ${escapeHtml(locataire.building_code || "-")}</p>
    <p><strong>Appartement :</strong> ${escapeHtml(locataire.apartment || "-")}</p>
    <p><strong>Description :</strong> ${escapeHtml(ticket.description || "Aucune description")}</p>
  `;
}

function formatDateTime(value) {
  if (!value) return "Date à confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" });
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
