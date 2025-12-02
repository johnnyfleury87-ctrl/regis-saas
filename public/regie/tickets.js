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

// =============================================================
// NOUVEAU BLOC POUR L'AFFICHAGE VERTICAL (V3)
// (Remplace l'ancien bloc pour la création des cartes)
// =============================================================

/**
 * Crée la carte HTML verticale pour un ticket.
 * @param {object} ticket - L'objet ticket complet de l'API.
 * @returns {HTMLElement}
 */
function createTicketCard(ticket) {
  const card = document.createElement("article");
  // Nouvelle classe CSS pour le design vertical
  card.className = "ticket-vertical-card"; 
  
  // *** LIGNE À AJOUTER CI-DESSOUS ***
  card.classList.add(`bg-status-${statut}`);

  const statut = ticket.statut || "nouveau";

  card.innerHTML = `
    <header class="ticket-v-header">
      <div>
        <h3>${escapeHtml(ticket.categorie)}: ${escapeHtml(ticket.piece)}</h3>
        <p class="ticket-id">Ticket #${escapeHtml(ticket.id ? ticket.id.substring(0, 8) : 'N/A')}</p>
      </div>
      <span class="status-badge status-${statut}">${formatStatut(statut)}</span>
    </header>

    <main class="ticket-v-body">
      <section class="ticket-v-section">
        <h4 class="ticket-v-section-title">Informations Locataire</h4>
        <div class="ticket-v-datarow">
          <span class="label">Nom complet</span>
          <span class="value">${escapeHtml(ticket.locataire_prenom || '')} ${escapeHtml(ticket.locataire_nom || '')}</span>
        </div>
        <div class="ticket-v-datarow">
          <span class="label">Adresse</span>
          <span class="value">${escapeHtml(ticket.adresse || '')}</span>
        </div>
        <div class="ticket-v-datarow">
          <span class="label">NPA / Ville</span>
          <span class="value">${escapeHtml(ticket.zip_code || '')} ${escapeHtml(ticket.city || '')}</span>
        </div>
        <div class="ticket-v-datarow">
          <span class="label">Email</span>
          <span class="value">${escapeHtml(ticket.locataire_email || 'Non fourni')}</span>
        </div>
      </section>

      <section class="ticket-v-section">
        <h4 class="ticket-v-section-title">Détails du Problème</h4>
        <div class="ticket-v-datarow">
          <span class="label">Détail</span>
          <span class="value">${escapeHtml(ticket.detail)}</span>
        </div>
        <div class="ticket-v-datarow">
          <span class="label">Description</span>
          <span class="value">${escapeHtml(ticket.description || 'Aucune description')}</span>
        </div>
        <div class="ticket-v-datarow">
          <span class="label">Disponibilité</span>
          <span class="value">${escapeHtml(formatDateTime(ticket.dispo1))}</span>
        </div>
      </section>
    </main>
    
    <footer class="ticket-v-footer">
      <!-- Le bouton d'action contextuel ira ici -->
    </footer>
  `;

  // Logique pour le bouton d'action
  const actionsContainer = card.querySelector('.ticket-v-footer');
  if (statut === 'nouveau' || statut === 'en_attente') {
    const btnAssigner = document.createElement('button');
    btnAssigner.className = 'btn-action btn-primary';
    btnAssigner.textContent = 'Assigner à une entreprise';
    btnAssigner.onclick = () => assignerTicket(ticket.id);
    actionsContainer.appendChild(btnAssigner);
  }

  return card;
}

/**
 * Affiche une alerte pour la future fonctionnalité d'assignation.
 * @param {string} ticketId - L'ID du ticket à assigner.
 */
function assignerTicket(ticketId) {
  alert(`Prochaine étape : ouvrir une fenêtre pour choisir une entreprise et assigner le ticket ${ticketId}.`);
}

// Helper pour formater le nom du statut en français.
function formatStatut(statut) {
  const statutMap = {
    nouveau: "Nouveau",
    en_attente: "En attente",
    assigne: "Assigné",
    en_cours: "En cours",
    termine: "Terminé",
  };
  return statutMap[statut] || statut.replace(/_/g, ' ');
}

// Helper pour formater la date et l'heure
function formatDateTime(value) {
  if (!value) return "Non renseignée";
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

// Helper pour échapper le HTML et prévenir les attaques XSS
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
