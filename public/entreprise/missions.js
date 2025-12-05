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
      // On affiche uniquement les missions qui ne sont pas encore acceptées
      if (mission.statut !== 'acceptée') {
        const card = createMissionCard(mission);
        missionsContainer.appendChild(card);
      }
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
  card.className = "mission-card";
  // On donne un ID unique à la carte pour pouvoir la supprimer de la page plus tard
  card.id = `mission-card-${mission.id}`;

  const priorite = mission.priorite || 'P4';
  const categorie = mission.categorie || 'Non défini';
  const piece = mission.piece || '';
  const ville = mission.ville || 'Non précisée';
  const budget = mission.budget_plafond ? `${mission.budget_plafond} CHF` : 'Aucun';
  const dispo = formatDateTime(mission.dispo1) || 'Non renseignée';

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
      <!-- Le bouton appelle maintenant la bonne fonction -->
      <button class="btn btn-primary" onclick="accepterMission('${mission.id}')">Accepter la mission</button>
    </footer>
  `;
  return card;
}

/**
 * Gère le clic sur "Accepter la mission".
 * Appelle l'API pour mettre à jour le statut, puis met à jour l'interface.
 * @param {string} missionId 
 */
async function accepterMission(missionId) {
  const card = document.getElementById(`mission-card-${missionId}`);
  const button = card.querySelector('button');

  // Désactiver le bouton pour éviter les double-clics
  button.disabled = true;
  button.textContent = 'Acceptation...';

  try {
    // On appelle notre API backend pour mettre à jour la mission
    const response = await fetch('/api/entreprise/missions/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        mission_id: missionId, 
        new_status: 'acceptée' 
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // En cas d'erreur de l'API, on affiche l'erreur
      throw new Error(result.error || "Une erreur s'est produite.");
    }

    // Si tout va bien, on fait disparaître la carte de la liste
    alert('Mission acceptée !');
    card.style.transition = 'opacity 0.5s ease';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 500); // On supprime l'élément après la transition

  } catch (error) {
    console.error("Erreur lors de l'acceptation de la mission:", error);
    alert(`Erreur : ${error.message}`);
    // On réactive le bouton si ça a échoué
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