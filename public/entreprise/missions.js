/**
 * Script pour la page listant les missions disponibles (côté Entreprise).
 * Fichier : /public/entreprise/missions.js
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page des missions initialisée.");
  const missionsContainer = document.getElementById("missions-container");
  const emptyState = document.getElementById("empty-state");
  
  try {
    const response = await fetch('/api/entreprise/missions');
    if (!response.ok) {
      throw new Error("Erreur de l'API lors du chargement des missions.");
    }
    
    const { missions } = await response.json();

    if (!missions || missions.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    missionsContainer.innerHTML = ''; // Vider avant d'ajouter
    missions.forEach(mission => {
      const card = createMissionCard(mission);
      missionsContainer.appendChild(card);
    });

  } catch (err) {
    console.error("Impossible de charger les missions:", err);
    missionsContainer.innerHTML = "<p>Erreur de chargement des missions. Veuillez réessayer plus tard.</p>";
  }
});

/**
 * Crée une carte HTML pour une mission.
 * @param {object} mission - Les données de la mission.
 * @returns {HTMLElement} L'élément de la carte.
 */
function createMissionCard(mission) {
  const card = document.createElement("article");
  card.className = "ticket-card"; // On réutilise le style des cartes de ticket

  card.innerHTML = `
    <header class="ticket-card-header">
      <div>
        <h3>${escapeHtml(mission.categorie)}: ${escapeHtml(mission.piece)}</h3>
        <p class="ticket-id">Mission #${escapeHtml(mission.id.substring(0, 8))}</p>
      </div>
      <span class="status-badge status-nouveau">${escapeHtml(mission.priorite || 'P4')}</span>
    </header>
    <main class="ticket-card-body">
      <div class="ticket-datarow"><span class="label">Ville</span><span class="value">${escapeHtml(mission.ville || 'Non précisée')}</span></div>
      <div class="ticket-datarow"><span class="label">Plafond budgétaire</span><span class="value">${mission.budget_plafond ? `${mission.budget_plafond} CHF` : 'Aucun'}</span></div>
      <div class="ticket-datarow"><span class="label">Disponibilité du locataire</span><span class="value">${formatDateTime(mission.dispo1)}</span></div>
    </main>
    <footer class="ticket-card-footer">
      <button class="btn-action" onclick="accepterMission('${mission.id}')">Accepter la mission</button>
    </footer>
  `;
  return card;
}

/**
 * Gère le clic sur "Accepter la mission".
 * @param {string} missionId 
 */
function accepterMission(missionId) {
  // La logique pour accepter la mission et la bloquer viendra ici (Étape 4)
  alert(`Prochaine étape : accepter la mission ${missionId}, la bloquer pour les autres entreprises, et obtenir les détails complets du locataire !`);
}

// --- Fonctions utilitaires ---
function formatDateTime(value) {
  if (!value) return "Non renseignée";
  try { 
    return new Date(value).toLocaleString("fr-CH", { 
      day: "2-digit", month: "2-digit", year: "numeric", 
      hour: "2-digit", minute: "2-digit" 
    }); 
  } 
  catch (e) { return value; }
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}