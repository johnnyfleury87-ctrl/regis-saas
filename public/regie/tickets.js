/**
 * Script pour la page de gestion des tickets côté Régie.
 * Fichier : /public/regie/tickets.js
 * Version : 5.0 (Nettoyée et optimisée)
 */

// -----------------------------------------------------------------------------
// I. INITIALISATION & VARIABLES GLOBALES
// -----------------------------------------------------------------------------

// Éléments du DOM
const ticketsContainer = document.getElementById("tickets-container");
const emptyState = document.getElementById("empty-state");
const filterButtons = document.querySelectorAll(".filter-btn");

// État de l'application
let allTickets = [];
let currentFilter = "all";
let regieId = null;

// Lancement du script
init().catch((err) => {
  console.error("Erreur critique lors de l'initialisation:", err);
  alert("Une erreur critique est survenue. Impossible de charger la page.");
});


// -----------------------------------------------------------------------------
// II. LOGIQUE PRINCIPALE (Initialisation et chargement)
// -----------------------------------------------------------------------------

/**
 * Fonction principale qui initialise la page.
 */
async function init() {
  console.log("Initialisation de la page des tickets...");

  // 1. Récupérer l'ID de la régie depuis l'URL
  const params = new URLSearchParams(window.location.search);
  regieId = params.get("regieId");

  if (!regieId) {
    alert("ERREUR : ID de la régie manquant dans l’URL. Redirection...");
    window.location.href = "/"; // Rediriger vers une page d'accueil ou de login
    return;
  }

  // 2. Charger les tickets depuis l'API
  await loadTickets();

  // 3. Mettre en place les écouteurs d'événements pour les filtres
  setupFilters();
  
  console.log("Page initialisée avec succès.");
}

/**
 * Récupère les tickets depuis l'API et met à jour l'affichage.
 */
async function loadTickets() {
  const url = `/api/regie/tickets?regieId=${encodeURIComponent(regieId)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.statusText}`);
    }
    const data = await response.json();
    allTickets = data.tickets || [];

    // Mettre à jour l'affichage avec les nouvelles données
    renderFilterCounts();
    renderTickets();

  } catch (error) {
    console.error("Échec du chargement des tickets:", error);
    ticketsContainer.innerHTML = `<p>Erreur lors de la récupération des tickets. Veuillez réessayer.</p>`;
  }
}


// -----------------------------------------------------------------------------
// III. GESTION DE L'AFFICHAGE (Filtres et rendu)
// -----------------------------------------------------------------------------

/**
 * Ajoute les listeners sur les boutons de filtre.
 */
function setupFilters() {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Met à jour le bouton actif
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Met à jour le filtre courant et ré-affiche les tickets
      currentFilter = btn.dataset.filter;
      renderTickets();
    });
  });
}

/**
 * Calcule et affiche le nombre de tickets dans chaque catégorie de filtre.
 */
function renderFilterCounts() {
  const counts = {
    all: allTickets.length,
    nouveau: allTickets.filter(t => t.statut === 'nouveau' || t.statut === 'en_attente').length,
    en_cours: allTickets.filter(t => t.statut === 'en_cours').length,
    termine: allTickets.filter(t => t.statut === 'termine').length,
  };
  
  document.querySelector('[data-count="all"]').textContent = counts.all;
  // Note: votre HTML utilise "Nouveaux (4)", donc je combine "nouveau" et "en_attente" ici.
  document.querySelector('[data-count="nouveaux"]').textContent = counts.nouveau;
  document.querySelector('[data-count="en_cours"]').textContent = counts.en_cours;
  document.querySelector('[data-count="termine"]').textContent = counts.termine;
}

/**
 * Affiche les tickets dans le conteneur principal en fonction du filtre actif.
 */
function renderTickets() {
  let ticketsToDisplay = allTickets;

  // Appliquer le filtre
  if (currentFilter === "nouveaux") {
    ticketsToDisplay = allTickets.filter(t => t.statut === 'nouveau' || t.statut === 'en_attente');
  } else if (currentFilter === "en_cours") {
    ticketsToDisplay = allTickets.filter(t => t.statut === 'en_cours');
  } else if (currentFilter === "termine") {
    ticketsToDisplay = allTickets.filter(t => t.statut === 'termine');
  }
  // "all" n'a pas besoin de filtre

  // Vider le conteneur
  ticketsContainer.innerHTML = "";

  // Gérer l'affichage si aucun ticket ne correspond
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

/**
 * Crée et retourne l'élément HTML pour une carte de ticket.
 * @param {object} ticket - L'objet ticket de l'API.
 * @returns {HTMLElement}
 */
function createTicketCard(ticket) {
  const card = document.createElement("article");
  card.className = "ticket-card"; 

  // Définir le statut par défaut AVANT de l'utiliser
  const statut = ticket.statut || "nouveau";
  
  // Ajouter la classe pour la couleur de fond
  card.classList.add(`bg-status-${statut}`);

  card.innerHTML = `
    <header class="ticket-card-header">
      <div>
        <h3>${escapeHtml(ticket.categorie)}: ${escapeHtml(ticket.piece)}</h3>
        <p class="ticket-id">Ticket #${escapeHtml(ticket.id ? ticket.id.substring(0, 8) : 'N/A')}</p>
      </div>
      <span class="status-badge status-${statut}">${formatStatut(statut)}</span>
    </header>
    <main class="ticket-card-body">
      <section class="ticket-section">
        <h4 class="ticket-section-title">Informations Locataire</h4>
        <div class="ticket-datarow"><span class="label">Nom</span><span class="value">${escapeHtml(ticket.locataire_prenom || '')} ${escapeHtml(ticket.locataire_nom || '')}</span></div>
        <div class="ticket-datarow"><span class="label">Adresse</span><span class="value">${escapeHtml(ticket.adresse || '')}</span></div>
        <div class="ticket-datarow"><span class="label">NPA / Ville</span><span class="value">${escapeHtml(ticket.zip_code || '')} ${escapeHtml(ticket.city || '')}</span></div>
        <div class="ticket-datarow"><span class="label">Email</span><span class="value">${escapeHtml(ticket.locataire_email || 'Non fourni')}</span></div>
      </section>
      <section class="ticket-section">
        <h4 class="ticket-section-title">Détails du Problème</h4>
        <div class="ticket-datarow"><span class="label">Détail</span><span class="value">${escapeHtml(ticket.detail)}</span></div>
        <div class="ticket-datarow"><span class="label">Description</span><span class="value">${escapeHtml(ticket.description || 'Aucune')}</span></div>
        <div class="ticket-datarow"><span class="label">Disponibilité</span><span class="value">${escapeHtml(formatDateTime(ticket.dispo1))}</span></div>
      </section>
    </main>
    <footer class="ticket-card-footer"></footer>
  `;

  // Ajouter le bouton d'action de manière dynamique
  const actionsContainer = card.querySelector('.ticket-card-footer');
  if (statut === 'nouveau' || statut === 'en_attente') {
    const btnAssigner = document.createElement('button');
    btnAssigner.className = 'btn-action';
    btnAssigner.textContent = 'Assigner à une entreprise';
    btnAssigner.onclick = () => assignerTicket(ticket.id);
    actionsContainer.appendChild(btnAssigner);
  }

  return card;
}


// -----------------------------------------------------------------------------
// IV. ACTIONS & HELPERS
// -----------------------------------------------------------------------------

/**
 * Fonction pour gérer l'assignation d'un ticket (pour l'instant, une alerte).
 * @param {string} ticketId - L'ID du ticket.
 */
function assignerTicket(ticketId) {
  alert(`Prochaine étape : ouvrir une pop-up pour assigner le ticket ${ticketId}.`);
  // Fututre logique: updateTicket(ticketId, { statut: 'assigne', entreprise_id: '...' });
}

/**
 * Met à jour un ticket via l'API.
 * @param {string} ticketId - L'ID du ticket à mettre à jour.
 * @param {object} changes - Un objet avec les champs à modifier (ex: { statut: 'en_cours' }).
 */
async function updateTicket(ticketId, changes) {
  try {
    const res = await fetch("/api/regie/tickets/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, ...changes }),
    });

    if (!res.ok) throw new Error(await res.text());
    
    // Mettre à jour l'affichage sans recharger toute la page (plus performant)
    await loadTickets(); 

  } catch (err) {
    console.error("Erreur lors de la mise à jour du ticket:", err);
    alert("La mise à jour a échoué. Recharge de la liste.");
    await loadTickets();
  }
}

// ----- Fonctions utilitaires (Helpers) -----

/**
 * Formate un nom de statut pour l'affichage.
 * @param {string} statut - Le statut de la base de données (ex: 'en_attente').
 * @returns {string} Le statut formaté (ex: 'En attente').
 */
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

/**
 * Formate une date ISO en format local lisible.
 * @param {string} value - La date au format ISO.
 * @returns {string} La date formatée.
 */
function formatDateTime(value) {
  if (!value) return "Non renseignée";
  try {
    return new Date(value).toLocaleString("fr-CH", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch (e) {
    return value; // Retourne la valeur originale si le format est invalide
  }
}

/**
 * Échappe les caractères HTML pour prévenir les failles XSS.
 * @param {*} str - La chaîne à échapper.
 * @returns {string} La chaîne sécurisée.
 */
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}