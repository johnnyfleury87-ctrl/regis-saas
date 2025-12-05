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
 * Crée une carte HTML pour une mission (NOUVEAU DESIGN).
 * @param {object} mission - Les données de la mission.
 * @returns {HTMLElement} L'élément de la carte.
 */
function createMissionCard(mission) {
  const card = document.createElement("article");
  card.className = "mission-card";

  const priorite = mission.priorite || 'P4';
  const categorie = mission.categorie || 'Non défini';
  const piece = mission.piece || '';
  const ville = mission.ville || 'Non précisée';
  const budget = mission.budget_plafond ? `${mission.budget_plafond} CHF` : 'Aucun';
  const dispo = formatDateTime(mission.dispo1) || 'Non renseignée';

  // --- MODIFICATION CI-DESSOUS ---
  card.innerHTML = `
    <header class="mission-card-header">
      <div>
        <h2>${escapeHtml(categorie)} : ${escapeHtml(piece)}</h2>
        <span class="mission-id">#${escapeHtml(mission.id.substring(0, 8))}</span>
      </div>
      <span class="priority-badge priority-${priorite.toLowerCase()}">${escapeHtml(priorite)}</span>
    </header>
    <div class="mission-card-body">
      <div class="info-row">
        <span class="label">📍 Ville</span>
        <span class="value">${escapeHtml(ville)}</span>
      </div>
      <div class="info-row">
        <span class="label">💰 Budget Plafond</span>
        <span class="value">${escapeHtml(budget)}</span>
      </div>
      <div class="info-row">
        <span class="label">🗓️ Disponibilité</span>
        <span class="value">${escapeHtml(dispo)}</span>
      </div>
    </div>
    <footer class="mission-card-footer">
      <!-- On remplace le <button> par un <a> qui est un lien -->
      <!-- Il pointe vers la page de détails avec le bon ID de mission -->
      <a 
        href="/entreprise/mission-details.html?id=${mission.id}" 
        class="btn btn-primary"
      >
        Voir les détails
      </a>
    </footer>
  `;
  return card;
}


// --- La fonction accepterMission(missionId) est supprimée car elle n'est plus utilisée ---


// --- Fonctions utilitaires (inchangées) ---
function formatDateTime(value) {
  if (!value) return null;
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