/**
 * Script pour la page listant les TICKETS disponibles (côté Entreprise).
 * Fichier : /public/entreprise/missions.js
 * Logique corrigée :
 * 1. Charge les tickets depuis l'API.
 * 2. Affiche une carte pour chaque ticket.
 * 3. Au clic sur "Accepter", envoie le ticket_id à l'API pour CRÉER une mission.
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page des tickets disponibles initialisée.");
  const ticketsContainer = document.getElementById("missions-container"); // On garde le même ID de conteneur pour l'instant
  const emptyState = document.getElementById("empty-state");

  try {
    // ÉTAPE 1 (Corrigée) : On charge les TICKETS et non les missions.
    // D'après votre routeur, l'API pour les tickets est '/api/regie/tickets'
    const response = await fetch('/api/regie/tickets'); 
    
    if (!response.ok) {
      throw new Error("Erreur de l'API lors du chargement des tickets.");
    }
    
    // L'API renvoie un objet { tickets: [...] }
    const { tickets } = await response.json();

    if (!tickets || tickets.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    ticketsContainer.innerHTML = ''; // Vider avant d'ajouter
    tickets.forEach(ticket => {
      // On affiche uniquement les tickets qui sont en attente
      if (ticket.statut === 'en_attente') {
        const card = createTicketCard(ticket); // On utilise la nouvelle fonction de création
        ticketsContainer.appendChild(card);
      }
    });

  } catch (err) {
    console.error("Impossible de charger les tickets:", err);
    ticketsContainer.innerHTML = "<p>Erreur de chargement des tickets disponibles. Veuillez réessayer plus tard.</p>";
  }
});

/**
 * ÉTAPE 2 (Corrigée) : Crée une carte HTML pour un TICKET.
 * @param {object} ticket - Les données du ticket.
 * @returns {HTMLElement} L'élément de la carte.
 */
function createTicketCard(ticket) {
  const card = document.createElement("article");
  card.className = "mission-card"; // On peut garder le même style
  card.id = `ticket-card-${ticket.id}`; // L'ID de la carte est basé sur l'ID du TICKET

  const priorite = ticket.priorite || 'P4';
  const categorie = ticket.categorie || 'Non défini';
  const piece = ticket.piece || '';
  const ville = ticket.ville || 'Non précisée';
  // IMPORTANT : la propriété s'appelle 'budget_plafo' dans votre table 'tickets'
  const budget = ticket.budget_plafo ? `${ticket.budget_plafo} CHF` : 'Aucun'; 
  const dispo = formatDateTime(ticket.dispo1) || 'Non renseignée';

  card.innerHTML = `
    <header class="mission-card-header">
      <div>
        <h2>${escapeHtml(categorie)} : ${escapeHtml(piece)}</h2>
        <span class="mission-id">TICKET #${escapeHtml(ticket.id.substring(0, 8))}</span>
      </div>
      <span class="priority-badge priority-${priorite.toLowerCase()}">${escapeHtml(priorite)}</span>
    </header>
    <div class="mission-card-body">
      <div class="info-row"><span class="label">📍 Ville</span><span class="value">${escapeHtml(ville)}</span></div>
      <div class="info-row"><span class="label">💰 Budget Plafond</span><span class="value">${escapeHtml(budget)}</span></div>
      <div class="info-row"><span class="label">🗓️ Disponibilité</span><span class="value">${escapeHtml(dispo)}</span></div>
    </div>
    <footer class="mission-card-footer">
      <!-- Le bouton appelle maintenant avec l'ID du TICKET -->
      <button class="btn btn-primary" onclick="accepterTicket('${ticket.id}')">Accepter la mission</button>
    </footer>
  `;
  return card;
}

/**
 * ÉTAPE 3 (Corrigée) : Gère le clic sur "Accepter".
 * Appelle l'API pour CRÉER une mission à partir du ticket.
 * @param {string} ticketId 
 */
async function accepterTicket(ticketId) {
  const card = document.getElementById(`ticket-card-${ticketId}`);
  const button = card.querySelector('button');

  button.disabled = true;
  button.textContent = 'Acceptation...';

  try {
    // Le backend s'occupe de savoir qui est l'entreprise.
    // Le frontend n'envoie plus que l'ID du ticket. C'est plus simple et plus sûr.
    const response = await fetch('/api/entreprise/missions/update', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ticket_id: ticketId // On envoie UNIQUEMENT le ticket_id
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Réponse de l'API:", result);
      throw new Error(result.error || "Une erreur s'est produite lors de la création de la mission.");
    }

    alert('Mission créée avec succès ! Le ticket est maintenant "en cours".');
    card.style.transition = 'opacity 0.5s ease';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 500);

  } catch (error) {
    console.error("Erreur lors de l'acceptation du ticket:", error);
    alert(`Erreur : ${error.message}`);
    button.disabled = false;
    button.textContent = 'Accepter la mission';
  }
}


// --- Fonctions utilitaires (inchangées) ---
function formatDateTime(value) {
  if (!value) return null;
  try { return new Date(value).toLocaleString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } 
  catch (e) { return value; }
}
function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
