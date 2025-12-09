const planningState = {
  userId: null,
  missions: [],
};

const planningSelectors = {};

document.addEventListener("DOMContentLoaded", () => {
  planningSelectors.list = document.getElementById("planning-list");
  planningSelectors.empty = document.getElementById("planning-empty");

  planningState.userId = localStorage.getItem("userId");
  if (!planningState.userId) {
    alert("Session expirée. Merci de vous reconnecter.");
    window.location.href = "/login.html";
    return;
  }

  loadPlanning();
});

async function loadPlanning() {
  try {
    const response = await fetch("/api/entreprise/missions", {
      headers: { "X-User-Id": planningState.userId },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Chargement du planning impossible");
    }

    planningState.missions = Array.isArray(payload.missionsActives)
      ? payload.missionsActives.slice()
      : [];

    planningState.missions.sort((a, b) => {
      const dateA = getSortableDate(a);
      const dateB = getSortableDate(b);
      return dateA - dateB;
    });

    renderPlanning();
  } catch (error) {
    console.error("Chargement planning échoué:", error);
    alert(error.message);
  }
}

function renderPlanning() {
  if (!planningSelectors.list) return;
  planningSelectors.list.innerHTML = "";

  if (!planningState.missions.length) {
    planningSelectors.empty?.classList.remove("hidden");
    return;
  }

  planningSelectors.empty?.classList.add("hidden");

  planningState.missions.forEach((mission) => {
    const ticket = mission.ticket || {};
    const locataire = mission.locataire || {};

    const card = document.createElement("article");
    card.className = "planning-item";

    const dateLabel = formatDateLabel(mission.date_intervention || ticket.dispo1);
    const heure = formatTime(mission.date_intervention || ticket.dispo1);
    const statut = (mission.statut || "en_attente").toUpperCase();

    card.innerHTML = `
      <header>
        <h3>${escapeHtml(ticket.categorie || "Mission")}${ticket.piece ? ` · ${escapeHtml(ticket.piece)}` : ""}</h3>
        <div>
          <span class="planning-time">${escapeHtml(dateLabel)}</span>
          ${heure ? `<span class="tag">${escapeHtml(heure)}</span>` : ""}
        </div>
      </header>
      <div class="planning-meta">
        <span><strong>Statut :</strong> ${escapeHtml(statut)}</span>
        <span><strong>Adresse :</strong> ${escapeHtml(locataire.address || ticket.adresse || "Non renseignée")}</span>
        <span><strong>Ville :</strong> ${escapeHtml(locataire.city || ticket.ville || "-")}</span>
        <span><strong>Locataire :</strong> ${escapeHtml(formatLocataire(locataire))}</span>
        ${ticket.priorite ? `<span><strong>Priorité :</strong> ${escapeHtml(ticket.priorite)}</span>` : ""}
      </div>
      <div class="planning-meta">
        <a class="btn btn-secondary" href="mission-details.html?id=${mission.id}">Détails</a>
      </div>
    `;

    planningSelectors.list.appendChild(card);
  });
}

function getSortableDate(mission) {
  const dateRef = mission.date_intervention || (mission.ticket && mission.ticket.dispo1);
  const parsed = dateRef ? Date.parse(dateRef) : NaN;
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function formatDateLabel(value) {
  if (!value) return "Date à fixer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  return date.toLocaleDateString("fr-CH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
}

function formatLocataire(locataire) {
  const noms = [locataire.prenom, locataire.nom].filter(Boolean).join(" ");
  return noms || locataire.email || "Non communiqué";
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
