console.log("Tickets régie – script chargé ✓");

const ticketsContainer = document.getElementById("tickets-container");
const emptyState = document.getElementById("empty-state");
const filterButtons = document.querySelectorAll(".filter-btn");

let allTickets = [];
let currentFilter = "all";
let regieId = null;

// ---------- Init ----------

init().catch((err) => {
  console.error("Erreur init tickets:", err);
  alert("Erreur lors du chargement des tickets.");
});

async function init() {
  console.log("Chargement des tickets régie…");

  const params = new URLSearchParams(window.location.search);
  regieId = params.get("regieId");

  if (!regieId) {
    alert("Régie introuvable (regieId manquant dans l’URL).");
    return;
  }

  await loadTickets();
  setupFilters();
}

// ---------- Chargement API ----------

async function loadTickets() {
  const url = `/api/regie/tickets?regieId=${encodeURIComponent(regieId)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Erreur API tickets :", await res.text());
    alert("Erreur lors du chargement des tickets régie.");
    return;
  }

  const json = await res.json();
  allTickets = json.tickets || [];

  renderFilterCounts();
  renderTickets();
}

// ---------- Filtres ----------

function setupFilters() {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderTickets();
    });
  });
}

function renderFilterCounts() {
  const total = allTickets.length;
  const enAttente = allTickets.filter((t) => t.statut === "en_attente").length;
  const enCours = allTickets.filter((t) => t.statut === "en_cours").length;
  const termines = allTickets.filter((t) => t.statut === "termine").length;

  document.querySelector('[data-count="all"]').textContent = total;
  document.querySelector('[data-count="en_attente"]').textContent = enAttente;
  document.querySelector('[data-count="en_cours"]').textContent = enCours;
  document.querySelector('[data-count="termine"]').textContent = termines;
}

// ---------- Rendu tickets ----------

function renderTickets() {
  let tickets = allTickets;

  if (currentFilter === "en_attente") {
    tickets = tickets.filter((t) => t.statut === "en_attente");
  } else if (currentFilter === "en_cours") {
    tickets = tickets.filter((t) => t.statut === "en_cours");
  } else if (currentFilter === "termine") {
    tickets = tickets.filter((t) => t.statut === "termine");
  }

  ticketsContainer.innerHTML = "";

  if (!tickets.length) {
    emptyState.classList.remove("hidden");
    return;
  } else {
    emptyState.classList.add("hidden");
  }

  tickets.forEach((ticket) => {
    const card = createTicketCard(ticket);
    ticketsContainer.appendChild(card);
  });
}

function createTicketCard(ticket) {
  const card = document.createElement("article");
  card.className = "ticket-card";

  const statut = ticket.statut || "en_attente";
  const priorite = ticket.priorite || "P4";

  const statusClass = `status-${statut}`;
  const priorityClass = `priority-${priorite}`;

  const statutLabel = formatStatut(statut);
  const prioriteLabel = priorite;

  const ticketNumber =
    ticket.ticket_number || (ticket.id ? `#${ticket.id.slice(0, 8)}` : "—");

  const locNom =
    ticket.locataire_prenom || ticket.locataire_nom
      ? `${ticket.locataire_prenom || ""} ${ticket.locataire_nom || ""}`.trim()
      : "—";

  const adresse =
    ticket.adresse && ticket.city
      ? `${ticket.adresse}, ${ticket.city}`
      : ticket.adresse || "—";

  const email = ticket.locataire_email || "—";

  const dispo1 = ticket.dispo1
    ? formatDateTime(ticket.dispo1)
    : "Non renseignée";

  card.innerHTML = `
    <div class="ticket-header">
      <div class="ticket-title-group">
        <div class="ticket-title-line">
          <span class="ticket-category">${escapeHtml(ticket.categorie || "—")}</span>
          <span class="ticket-piece">· ${escapeHtml(ticket.piece || "—")}</span>
        </div>
        <span class="ticket-number">Ticket ${escapeHtml(ticketNumber)}</span>
      </div>

      <div class="ticket-header-right">
        <span class="pill priority-pill ${priorityClass}">${prioriteLabel}</span>
        <span class="pill status-pill ${statusClass}">${statutLabel}</span>
      </div>
    </div>

    <div class="ticket-body">
      <div class="ticket-cols">
        <div>
          <div class="ticket-section-title">Locataire</div>
          <div class="data-line"><span class="data-label">Nom :</span> <span class="data-value">${escapeHtml(
            locNom
          )}</span></div>
          <div class="data-line"><span class="data-label">Adresse :</span> <span class="data-value">${escapeHtml(
            adresse
          )}</span></div>
          <div class="data-line"><span class="data-label">Email :</span> <span class="data-value">${escapeHtml(
            email
          )}</span></div>
        </div>

        <div>
          <div class="ticket-section-title">Problème</div>
          <div class="data-line"><span class="data-label">Détail :</span> <span class="data-value">${escapeHtml(
            ticket.detail || "—"
          )}</span></div>
          <div class="data-line"><span class="data-label">Description :</span> <span class="data-value">${escapeHtml(
            ticket.description || "—"
          )}</span></div>
          <div class="dispo-line"><span class="data-label">Disponibilité 1 :</span> <span class="data-value">${escapeHtml(
            dispo1
          )}</span></div>

          <div class="actions-row">
            <label>
              <span class="data-muted">Priorité :</span>
              <select class="select-sm priority-select">
                ${renderPrioriteOptions(priorite)}
              </select>
            </label>

            <label>
              <span class="data-muted">Statut :</span>
              <select class="select-sm status-select">
                ${renderStatutOptions(statut)}
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  `;

  const prioritySelect = card.querySelector(".priority-select");
  const statusSelect = card.querySelector(".status-select");

  prioritySelect.addEventListener("change", async () => {
    const newValue = prioritySelect.value;
    await updateTicket(ticket.id, { priorite: newValue });
  });

  statusSelect.addEventListener("change", async () => {
    const newValue = statusSelect.value;
    await updateTicket(ticket.id, { statut: newValue });
  });

  return card;
}

// ---------- Helpers affichage ----------

function formatStatut(statut) {
  switch (statut) {
    case "en_attente":
      return "En attente";
    case "en_cours":
      return "En cours";
    case "termine":
      return "Terminé";
    default:
      return statut;
  }
}

function renderPrioriteOptions(current) {
  const values = ["P1", "P2", "P3", "P4"];
  return values
    .map(
      (v) =>
        `<option value="${v}" ${
          v === current ? "selected" : ""
        }>${v}</option>`
    )
    .join("");
}

function renderStatutOptions(current) {
  const values = [
    { value: "en_attente", label: "En attente" },
    { value: "en_cours", label: "En cours" },
    { value: "termine", label: "Terminé" },
  ];
  return values
    .map(
      (s) =>
        `<option value="${s.value}" ${
          s.value === current ? "selected" : ""
        }>${s.label}</option>`
    )
    .join("");
}

function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- Update API ----------

async function updateTicket(ticketId, changes) {
  try {
    const res = await fetch("/api/regie/tickets/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, ...changes }),
    });

    if (!res.ok) {
      console.error("Erreur API update ticket:", await res.text());
      alert("Erreur lors de la mise à jour du ticket.");
      // on recharge pour ne pas rester dans un état incohérent
      await loadTickets();
      return;
    }

    const json = await res.json();
    const updated = json.ticket;

    const index = allTickets.findIndex((t) => t.id === ticketId);
    if (index !== -1) {
      allTickets[index] = { ...allTickets[index], ...updated };
    }

    renderFilterCounts();
    renderTickets();
  } catch (err) {
    console.error("Erreur update ticket:", err);
    alert("Erreur lors de la mise à jour du ticket.");
    await loadTickets();
  }
}
