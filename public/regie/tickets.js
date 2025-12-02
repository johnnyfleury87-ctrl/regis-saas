/**
 * Script pour la page de gestion des tickets côté Régie.
 * Fichier : /public/regie/tickets.js
 * Version : 6.0 (Avec gestion du pop-up d'assignation)
 */

// -----------------------------------------------------------------------------
// I. INITIALISATION & VARIABLES GLOBALES
// -----------------------------------------------------------------------------

// Éléments du DOM pour les tickets
const ticketsContainer = document.getElementById("tickets-container");
const emptyState = document.getElementById("empty-state");
const filterButtons = document.querySelectorAll(".filter-btn");

// NOUVEAU : Éléments du DOM pour le pop-up (modal)
const modalOverlay = document.getElementById("assign-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const publishMissionBtn = document.getElementById("publish-mission-btn");
const prioriteSelect = document.getElementById("priorite-select");
const budgetInput = document.getElementById("budget-input");

// État de l'application
let allTickets = [];
let currentFilter = "all";
let regieId = null;
let currentTicketIdForModal = null; // NOUVEAU : Pour garder en mémoire le ticket en cours d'assignation

// Lancement du script
init().catch((err) => {
  console.error("Erreur critique lors de l'initialisation:", err);
  alert("Une erreur critique est survenue. Impossible de charger la page.");
});


// -----------------------------------------------------------------------------
// II. LOGIQUE PRINCIPALE (Initialisation et chargement)
// -----------------------------------------------------------------------------

async function init() {
  console.log("Initialisation de la page des tickets (v6)...");
  const params = new URLSearchParams(window.location.search);
  regieId = params.get("regieId");

  if (!regieId) {
    alert("ERREUR : ID de la régie manquant dans l’URL.");
    return;
  }

  await loadTickets();
  setupFilters();
  setupModalListeners(); // NOUVEAU : Mettre en place les listeners du pop-up
  console.log("Page initialisée avec succès.");
}

async function loadTickets() {
    // ... (Cette fonction ne change pas)
    const url = `/api/regie/tickets?regieId=${encodeURIComponent(regieId)}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur API: ${response.statusText}`);
      const data = await response.json();
      allTickets = data.tickets || [];
      renderFilterCounts();
      renderTickets();
    } catch (error) {
      console.error("Échec du chargement des tickets:", error);
      ticketsContainer.innerHTML = `<p>Erreur lors de la récupération des tickets.</p>`;
    }
}


// -----------------------------------------------------------------------------
// III. GESTION DE L'AFFICHAGE (Filtres et rendu)
// -----------------------------------------------------------------------------

function setupFilters() {
    // ... (Cette fonction ne change pas)
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
    // ... (Cette fonction ne change pas, mais j'ajoute "publie")
    const counts = {
        all: allTickets.length,
        nouveaux: allTickets.filter(t => ['nouveau', 'en_attente'].includes(t.statut)).length,
        publie: allTickets.filter(t => t.statut === 'publie').length, // NOUVEAU
        en_cours: allTickets.filter(t => t.statut === 'en_cours').length,
        termine: allTickets.filter(t => t.statut === 'termine').length,
      };
      
      document.querySelector('[data-count="all"]').textContent = counts.all;
      document.querySelector('[data-count="nouveaux"]').textContent = counts.nouveaux;
      // Il faudra ajouter un filtre "Publiés" dans le HTML si vous le voulez
      document.querySelector('[data-count="en_cours"]').textContent = counts.en_cours;
      document.querySelector('[data-count="termine"]').textContent = counts.termine;
}

function renderTickets() {
    // ... (Logique de filtre mise à jour)
    let ticketsToDisplay = allTickets;
    if (currentFilter === "nouveaux") {
        ticketsToDisplay = allTickets.filter(t => ['nouveau', 'en_attente'].includes(t.statut));
    } else if (currentFilter === "publie") { // NOUVEAU
        ticketsToDisplay = allTickets.filter(t => t.statut === 'publie');
    } else if (currentFilter === "en_cours") {
        ticketsToDisplay = allTickets.filter(t => t.statut === 'en_cours');
    } else if (currentFilter === "termine") {
        ticketsToDisplay = allTickets.filter(t => t.statut === 'termine');
    }

    ticketsContainer.innerHTML = "";
    if (ticketsToDisplay.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
        ticketsToDisplay.forEach((ticket) => {
          const card = createTicketCard(ticket);
          ticketsContainer.appendChild(card);
        });
    }
}

function createTicketCard(ticket) {
    // ... (Cette fonction ne change pas)
    const card = document.createElement("article");
    card.className = "ticket-card"; 
    const statut = ticket.statut || "nouveau";
    card.classList.add(`bg-status-${statut}`);
    card.innerHTML = `
      <header class="ticket-card-header">
        <div><h3>${escapeHtml(ticket.categorie)}: ${escapeHtml(ticket.piece)}</h3><p class="ticket-id">Ticket #${escapeHtml(ticket.id ? ticket.id.substring(0, 8) : 'N/A')}</p></div>
        <span class="status-badge status-${statut}">${formatStatut(statut)}</span>
      </header>
      <main class="ticket-card-body">
        <section class="ticket-section"><h4 class="ticket-section-title">Informations Locataire</h4><div class="ticket-datarow"><span class="label">Nom</span><span class="value">${escapeHtml(ticket.locataire_prenom || '')} ${escapeHtml(ticket.locataire_nom || '')}</span></div><div class="ticket-datarow"><span class="label">Adresse</span><span class="value">${escapeHtml(ticket.adresse || '')}</span></div><div class="ticket-datarow"><span class="label">NPA / Ville</span><span class="value">${escapeHtml(ticket.zip_code || '')} ${escapeHtml(ticket.city || '')}</span></div><div class="ticket-datarow"><span class="label">Email</span><span class="value">${escapeHtml(ticket.locataire_email || 'Non fourni')}</span></div><div class="ticket-datarow"><span class="label">Téléphone</span><span class="value">${escapeHtml(ticket.phone || 'Non fourni')}</span></div></section>
        <section class="ticket-section"><h4 class="ticket-section-title">Détails du Problème</h4><div class="ticket-datarow"><span class="label">Détail</span><span class="value">${escapeHtml(ticket.detail)}</span></div><div class="ticket-datarow"><span class="label">Description</span><span class="value">${escapeHtml(ticket.description || 'Aucune')}</span></div><div class="ticket-datarow"><span class="label">Disponibilité 1</span><span class="value">${escapeHtml(formatDateTime(ticket.dispo1))}</span></div><div class="ticket-datarow"><span class="label">Disponibilité 2</span><span class="value">${escapeHtml(formatDateTime(ticket.dispo2))}</span></div><div class="ticket-datarow"><span class="label">Disponibilité 3</span><span class="value">${escapeHtml(formatDateTime(ticket.dispo3))}</span></div></section>
      </main>
      <footer class="ticket-card-footer"></footer>
    `;
    const actionsContainer = card.querySelector('.ticket-card-footer');
    if (statut === 'nouveau' || statut === 'en_attente') {
      const btnAssigner = document.createElement('button');
      btnAssigner.className = 'btn-action';
      btnAssigner.textContent = 'Publier une mission';
      btnAssigner.onclick = () => assignerTicket(ticket.id);
      actionsContainer.appendChild(btnAssigner);
    }
    return card;
}


// -----------------------------------------------------------------------------
// IV. ACTIONS & POP-UP (MODAL)
// -----------------------------------------------------------------------------

/**
 * NOUVEAU : Met en place les listeners pour ouvrir/fermer le pop-up.
 */
function setupModalListeners() {
    closeModalBtn.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) { // Ne ferme que si on clique sur le fond gris
        closeModal();
      }
    });
    publishMissionBtn.addEventListener("click", handlePublishMission);
}

/**
 * NOUVEAU : Gère l'ouverture du pop-up.
 * @param {string} ticketId - L'ID du ticket à assigner.
 */
function assignerTicket(ticketId) {
  console.log(`Ouverture du pop-up pour le ticket ${ticketId}`);
  currentTicketIdForModal = ticketId; // Stocke l'ID
  modalOverlay.classList.remove("hidden"); // Affiche le pop-up
}

/**
 * NOUVEAU : Gère la fermeture du pop-up.
 */
function closeModal() {
    modalOverlay.classList.add("hidden");
    currentTicketIdForModal = null; // Réinitialise l'ID
    // Vider les champs pour la prochaine fois
    prioriteSelect.value = "P4";
    budgetInput.value = "";
}

/**
 * NOUVEAU : Logique lors du clic sur "Publier la mission".
 */
async function handlePublishMission() {
    const priorite = prioriteSelect.value;
    const budget = budgetInput.value;

    if (!currentTicketIdForModal) {
        alert("Erreur : aucun ticket sélectionné.");
        return;
    }
    if (!budget || isNaN(parseFloat(budget))) {
        alert("Veuillez entrer un plafond budgétaire valide.");
        return;
    }

    console.log(`Publication de la mission pour le ticket ${currentTicketIdForModal} avec priorité ${priorite} et budget ${budget}`);

    // Prépare les données à envoyer à l'API
    const changes = {
        priorite: priorite,
        budget_plafond: parseFloat(budget),
        statut: 'publie' // Le nouveau statut pour la marketplace !
    };

    // Appelle la fonction de mise à jour existante
    await updateTicket(currentTicketIdForModal, changes);

    closeModal(); // Ferme le pop-up après la publication
}


/**
 * Met à jour un ticket via l'API.
 * @param {string} ticketId - L'ID du ticket à mettre à jour.
 * @param {object} changes - Un objet avec les champs à modifier.
 */
async function updateTicket(ticketId, changes) {
    // ... (Cette fonction ne change pas)
    try {
        const res = await fetch("/api/regie/tickets/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId, ...changes }),
        });
        if (!res.ok) throw new Error(await res.text());
        await loadTickets(); 
      } catch (err) {
        console.error("Erreur lors de la mise à jour du ticket:", err);
        alert("La mise à jour a échoué. Recharge de la liste.");
        await loadTickets();
      }
}

// -----------------------------------------------------------------------------
// V. FONCTIONS UTILITAIRES (HELPERS)
// -----------------------------------------------------------------------------
// ... (Ces fonctions ne changent pas)
function formatStatut(statut) {
    const statutMap = { nouveau: "Nouveau", en_attente: "En attente", publie: "Publié", en_cours: "En cours", termine: "Terminé" };
    return statutMap[statut] || statut.replace(/_/g, ' ');
}
function formatDateTime(value) {
    if (!value) return "Non renseignée";
    try { return new Date(value).toLocaleString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } 
    catch (e) { return value; }
}
function escapeHtml(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}