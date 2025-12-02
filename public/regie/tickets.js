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
// NOUVEAU BLOC POUR LA CRÉATION DES CARTES DE TICKET
// (Remplace l'ancien bloc de la ligne 105 à 257)
// =============================================================

/**
 * Crée la nouvelle carte HTML pour un ticket, orientée action.
 * @param {object} ticket - L'objet ticket complet de l'API.
 * @returns {HTMLElement}
 */
function createTicketCard(ticket) {
  // On utilise une nouvelle classe CSS pour le nouveau design.
  const card = document.createElement("article");
  card.className = "ticket-card-new"; 
  
  // Le statut par défaut est "nouveau" s'il n'est pas défini.
  const statut = ticket.statut || "nouveau";
  
  // Construction de l'adresse complète avec NPA et Ville
  const fullAddress = [
    ticket.adresse,
    ticket.zip_code, // Assurez-vous que l'API renvoie bien `zip_code`
    ticket.city
  ].filter(Boolean).join(', '); // "filter(Boolean)" retire les éléments vides (null, undefined, "")

  card.innerHTML = `
    <header class="ticket-header-new">
      <div>
        <h4>${escapeHtml(ticket.categorie)}: ${escapeHtml(ticket.piece)}</h4>
        <span class="ticket-id">Ticket #${escapeHtml(ticket.id ? ticket.id.substring(0, 8) : 'N/A')}</span>
      </div>
      <span class="status-badge status-${statut}">${formatStatut(statut)}</span>
    </header>

    <main class="ticket-main-content">
      <section class="ticket-section">
        <h5 class="ticket-section-title">Locataire</h5>
        <div class="data-pair">
          <span class="label">Nom</span>
          <span class="value">${escapeHtml(ticket.locataire_prenom || '')} ${escapeHtml(ticket.locataire_nom || '')}</span>
        </div>
        <div class="data-pair">
          <span class="label">Adresse</span>
          <span class="value">${escapeHtml(fullAddress) || 'Non fournie'}</span>
        </div>
      </section>
      
      <section class="ticket-section">
        <h5 class="ticket-section-title">Problème</h5>
        <div class="data-pair">
          <span class="label">Détail</span>
          <span class="value">${escapeHtml(ticket.detail)}</span>
        </div>
        <div class="data-pair">
          <span class="label">Disponibilité du locataire</span>
          <span class="value">${escapeHtml(formatDateTime(ticket.dispo1))}</span>
        </div>
      </section>
    </main>
    
    <footer class="ticket-actions-new">
      <!-- Les boutons d'action contextuels apparaîtront ici -->
    </footer>
  `;

  // Logique pour afficher le bon bouton d'action en fonction du statut
  const actionsContainer = card.querySelector('.ticket-actions-new');
  
  if (statut === 'nouveau' || statut === 'en_attente') {
    const btnAssigner = document.createElement('button');
    btnAssigner.className = 'btn-action btn-primary';
    btnAssigner.textContent = 'Assigner à une entreprise';
    btnAssigner.onclick = () => assignerTicket(ticket.id);
    actionsContainer.appendChild(btnAssigner);
  }
  // Bientôt, nous ajouterons d'autres conditions ici.
  // Exemple: if (statut === 'assigne') { /* Bouton pour relancer */ }

  return card;
}

/**
 * Affiche une alerte pour la future fonctionnalité d'assignation.
 * @param {string} ticketId - L'ID du ticket à assigner.
 */
function assignerTicket(ticketId) {
  alert(`Prochaine étape : ouvrir une fenêtre pour choisir une entreprise et assigner le ticket ${ticketId}.`);
  // Ici, nous appellerons bientôt l'API pour changer le statut en "assigne".
}

// Helper pour formater le nom du statut en français propre.
// Cette fonction remplace l'ancienne `formatStatut`.
function formatStatut(statut) {
  const statutMap = {
    nouveau: "Nouveau",
    en_attente: "En attente",
    assigne: "Assigné",
    en_cours: "En cours",
    termine: "Terminé",
  };
  return statutMap[statut] || statut.replace('_', ' ');
}

// Les anciennes fonctions renderPrioriteOptions et renderStatutOptions ont été supprimées.
// Les fonctions `formatDateTime` et `escapeHtml` (qui se trouvent après la ligne 257)
// sont toujours utiles et doivent être conservées.


// ... (gardez le reste du fichier : formatDateTime, escapeHtml, updateTicket) ...
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
