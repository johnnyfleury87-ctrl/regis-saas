/**
 * Script pour la page de gestion des tickets côté Régie.
 * Fichier : /public/regie/regie.js
 * Version : 7.0 (Logique unifiée et nettoyée)
 */

// -----------------------------------------------------------------------------
// I. ÉLÉMENTS DU DOM & VARIABLES GLOBALES
// -----------------------------------------------------------------------------
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
let currentTicketIdForModal = null;

// -----------------------------------------------------------------------------
// II. LOGIQUE PRINCIPALE (INITIALISATION)
// -----------------------------------------------------------------------------

// On exécute tout le script une fois que la page est chargée.
document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
        console.error("Erreur critique lors de l'initialisation:", err);
        if (ticketsContainer) {
            ticketsContainer.innerHTML = `<p class="error-msg">Une erreur critique est survenue. Impossible de charger la page des tickets.</p>`;
        }
    });
});

async function init() {
    console.log("Initialisation de la page des tickets (v7.0)...");
    
    // On s'assure qu'on est bien sur la page des tickets avant de continuer.
    if (!ticketsContainer) return;

    // 1. On récupère le regieId UNIQUEMENT depuis l'URL. C'est la source la plus fiable.
    const params = new URLSearchParams(window.location.search);
    const regieId = params.get("regieId");

    if (!regieId) {
        ticketsContainer.innerHTML = `<p class="error-msg">ERREUR : ID de la régie manquant. Veuillez retourner au tableau de bord et réessayer.</p>`;
        return;
    }

    // 2. On charge les tickets en passant l'ID.
    await loadTickets(regieId);

    // 3. On met en place les filtres et les actions.
    setupFilters();
    setupModalListeners();
    console.log("Page initialisée avec succès.");
}

async function loadTickets(regieId) {
    console.log(`Chargement des tickets pour la régie : ${regieId}`);
    try {
        const response = await fetch(`/api/regie/tickets?regieId=${regieId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Le serveur a répondu avec une erreur ${response.status}` }));
            throw new Error(`Erreur API : ${errorData.error}`);
        }
        
        const data = await response.json();
        allTickets = data.tickets || [];

        console.log(`${allTickets.length} ticket(s) chargé(s) depuis l'API.`);

        renderFilterCounts();
        renderTickets();

    } catch (error) {
        console.error('Échec du chargement des tickets:', error);
        ticketsContainer.innerHTML = `<p class="error-msg">Erreur lors de la récupération des tickets : ${error.message}</p>`;
    }
}

// -----------------------------------------------------------------------------
// III. GESTION DE L'AFFICHAGE (RENDU & FILTRES)
// -----------------------------------------------------------------------------

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
        if(emptyState) emptyState.classList.remove("hidden");
    } else {
        if(emptyState) emptyState.classList.add("hidden");
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
    
    // On utilise les nouvelles données formatées par l'API
    const locataireNom = ticket.locataireNom || "Non renseigné";
    const locataireAdresse = ticket.locataireAdresse.startsWith(',') ? 'Non renseignée' : ticket.locataireAdresse;

    // --- AFFICHAGE DES DISPONIBILITÉS ---
    const dispoHtml = `
        <div class="ticket-datarow">
            <span class="label">Disponibilités</span>
            <span class="value">
                ${ticket.dispo1 || 'Non spécifiée'} <br>
                ${ticket.dispo2 || ''} <br>
                ${ticket.dispo3 || ''}
            </span>
        </div>
    `;
    
    card.innerHTML = `
      <header class="ticket-card-header">
        <div><h3>${escapeHtml(ticket.categorie)}: ${escapeHtml(ticket.piece)}</h3><p class="ticket-id">Ticket #${escapeHtml(ticket.id ? ticket.id.substring(0, 8) : 'N/A')}</p></div>
        <span class="status-badge status-${statut}">${formatStatut(statut)}</span>
      </header>
      <main class="ticket-card-body">
        <section class="ticket-section">
          <h4 class="ticket-section-title">Informations Locataire</h4>
          <div class="ticket-datarow"><span class="label">Nom</span><span class="value">${escapeHtml(locataireNom)}</span></div>
          <div class="ticket-datarow"><span class="label">Adresse</span><span class="value">${escapeHtml(locataireAdresse)}</span></div>
        </section>
        <section class="ticket-section">
          <h4 class="ticket-section-title">Détails du Problème</h4>
          <div class="ticket-datarow"><span class="label">Détail</span><span class="value">${escapeHtml(ticket.description)}</span></div>
          ${dispoHtml}
          <div class="ticket-datarow"><span class="label">Créé le</span><span class="value">${formatDateTime(ticket.created_at)}</span></div>
        </section>
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

function setupModalListeners() {
    if(closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if(modalOverlay) modalOverlay.addEventListener("click", (event) => {
        if (event.target === modalOverlay) closeModal();
    });
    if(publishMissionBtn) publishMissionBtn.addEventListener("click", handlePublishMission);
}

function assignerTicket(ticketId) {
    console.log(`Ouverture du pop-up pour le ticket ${ticketId}`);
    currentTicketIdForModal = ticketId;
    if(modalOverlay) modalOverlay.classList.remove("hidden");
}

function closeModal() {
    if(modalOverlay) modalOverlay.classList.add("hidden");
    currentTicketIdForModal = null;
    if(prioriteSelect) prioriteSelect.value = "P4";
    if(budgetInput) budgetInput.value = "";
}

async function handlePublishMission() {
    const priorite = prioriteSelect.value;
    const budget = budgetInput.value;
    const regieId = new URLSearchParams(window.location.search).get("regieId");

    if (!currentTicketIdForModal || !regieId) return alert("Erreur : ID du ticket ou de la régie manquant.");
    if (!budget || isNaN(parseFloat(budget))) return alert("Veuillez entrer un plafond budgétaire valide.");

    const changes = {
        priorite,
        budget_plafond: parseFloat(budget),
        statut: 'publie'
    };

    await updateTicket(currentTicketIdForModal, changes, regieId);
    closeModal();
}

async function updateTicket(ticketId, changes, regieId) {
    try {
        const res = await fetch("/api/tickets/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId, changes }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || "La réponse du serveur n'est pas OK");
        }
        
        console.log("Ticket mis à jour, rechargement de la liste...");
        await loadTickets(regieId); 
    } catch (err) {
        console.error("Erreur lors de la mise à jour du ticket:", err);
        alert("La mise à jour a échoué. Recharge de la liste.");
        await loadTickets(regieId);
    }
}

// -----------------------------------------------------------------------------
// V. FONCTIONS UTILITAIRES
// -----------------------------------------------------------------------------
function formatStatut(statut) {
    const statutMap = { nouveau: "Nouveau", en_attente: "En attente", publie: "Publié", en_cours: "En cours", termine: "Terminé" };
    return statutMap[statut] || statut.replace(/_/g, ' ');
}
function formatDateTime(value) {
    if (!value) return "Non renseigné";
    return new Date(value).toLocaleString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}