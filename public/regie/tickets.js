/**
 * Script pour la page de gestion des tickets côté Régie.
 * Fichier : /public/regie/tickets.js
 * Version : 6.3 (Correction finale du routage API)
 */

// ... (Le début du fichier est identique)

// I. INITIALISATION & VARIABLES GLOBALES
const ticketsContainer = document.getElementById("tickets-container");
const emptyState = document.getElementById("empty-state");
const filterButtons = document.querySelectorAll(".filter-btn");
const modalOverlay = document.getElementById("assign-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const publishMissionBtn = document.getElementById("publish-mission-btn");
const prioriteSelect = document.getElementById("priorite-select");
const budgetInput = document.getElementById("budget-input");
let allTickets = [];
let currentFilter = "all";
let regieId = null;
let currentTicketIdForModal = null;

init().catch((err) => {
  console.error("Erreur critique lors de l'initialisation:", err);
  // On évite l'alerte si l'élément n'existe pas sur la page
  if (document.getElementById('tickets-container')) {
    alert("Une erreur critique est survenue. Impossible de charger la page.");
  }
});


// II. LOGIQUE PRINCIPALE
async function init() {
  console.log("Initialisation de la page des tickets (v6.3)...");
  // Si nous ne sommes pas sur la page des tickets, on ne fait rien.
  if (!ticketsContainer) {
    console.log("Pas sur la page des tickets, initialisation annulée.");
    return;
  }
  
  regieId = new URLSearchParams(window.location.search).get("regieId") || localStorage.getItem('regieId');
  if (!regieId) {
    alert("ERREUR : ID de la régie manquant. Veuillez vous reconnecter.");
    return;
  }
  await loadTickets();
  setupFilters();
  setupModalListeners();
  console.log("Page des tickets initialisée avec succès.");
}

async function loadTickets() {
    console.log(`Chargement des tickets pour la régie: ${regieId}`);
    try {
        // --- CORRECTION : On réutilise l'ancienne URL qui fonctionnait ---
        const response = await fetch(`/api/regie/tickets?regieId=${regieId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erreur API: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        allTickets = data.tickets || [];

        renderFilterCounts();
        renderTickets();
        console.log(`${allTickets.length} tickets chargés.`);

    } catch (error) {
        console.error('Échec du chargement des tickets:', error);
        if (ticketsContainer) {
            ticketsContainer.innerHTML = '<p>Erreur lors de la récupération des tickets.</p>';
        }
    }
}

// ... (Toutes les fonctions de rendu restent identiques)

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
    const counts = {
        all: allTickets.length,
        nouveaux: allTickets.filter(t => ['nouveau', 'en_attente'].includes(t.statut)).length,
        publie: allTickets.filter(t => t.statut === 'publie').length,
        en_cours: allTickets.filter(t => t.statut === 'en_cours').length,
        termine: allTickets.filter(t => t.statut === 'termine').length,
      };
      document.querySelector('[data-count="all"]').textContent = counts.all;
      document.querySelector('[data-count="nouveaux"]').textContent = counts.nouveaux;
      document.querySelector('[data-count="en_cours"]').textContent = counts.en_cours;
      document.querySelector('[data-count="termine"]').textContent = counts.termine;
}

function renderTickets() {
    let ticketsToDisplay = allTickets;
    if (currentFilter === "nouveaux") {
        ticketsToDisplay = allTickets.filter(t => ['nouveau', 'en_attente'].includes(t.statut));
    } else if (currentFilter === "publie") {
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


// IV. ACTIONS & POP-UP (MODAL)
function setupModalListeners() {
    closeModalBtn.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) closeModal();
    });
    publishMissionBtn.addEventListener("click", handlePublishMission);
}

function assignerTicket(ticketId) {
  console.log(`Ouverture du pop-up pour le ticket ${ticketId}`);
  currentTicketIdForModal = ticketId;
  modalOverlay.classList.remove("hidden");
}

function closeModal() {
    modalOverlay.classList.add("hidden");
    currentTicketIdForModal = null;
    prioriteSelect.value = "P4";
    budgetInput.value = "";
}

async function handlePublishMission() {
    if (!currentTicketIdForModal) return alert("Erreur : aucun ticket sélectionné.");
    const budget = budgetInput.value;
    if (!budget || isNaN(parseFloat(budget))) return alert("Veuillez entrer un plafond budgétaire valide.");

    const changes = {
        priorite: prioriteSelect.value,
        budget_plafond: parseFloat(budget),
        statut: 'publie'
    };
    
    console.log(`Publication de la mission pour le ticket ${currentTicketIdForModal}`, changes);
    await updateTicket(currentTicketIdForModal, changes);
    closeModal();
}


/**
 * Met à jour un ticket via l'API.
 */
async function updateTicket(ticketId, changes) {
    try {
        // --- CORRECTION FINALE : On utilise l'URL /api/index.js qui est le routeur principal ---
        const res = await fetch("/api/index.js", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // On passe le ticketId et les changements comme avant
          body: JSON.stringify({ ticketId, ...changes }),
        });

        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.error || "La réponse du serveur n'est pas OK");
        }
        
        console.log("Ticket mis à jour avec succès, rechargement de la liste...");
        await loadTickets(); 

      } catch (err) {
        console.error("Erreur lors de la mise à jour du ticket:", err);
        alert(`La mise à jour a échoué: ${err.message}. Recharge de la liste.`);
        await loadTickets();
      }
}

// V. FONCTIONS UTILITAIRES (HELPERS)
// ... (Ces fonctions n'ont pas changé)
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