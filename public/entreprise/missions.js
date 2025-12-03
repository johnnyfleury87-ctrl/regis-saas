/**
 * Script pour la page listant les missions disponibles (côté Entreprise).
 * Fichier : /public/entreprise/missions.js
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page des missions initialisée.");
  // On renomme la fonction de chargement pour pouvoir l'appeler plus tard
  await loadAndDisplayMissions(); 
});

/**
 * NOUVEAU : Fonction dédiée pour charger et afficher les missions.
 * Cela nous permet de rafraîchir la liste facilement après une action.
 */
async function loadAndDisplayMissions() {
  const missionsContainer = document.getElementById("missions-container");
  const emptyState = document.getElementById("empty-state");
  
  try {
    const response = await fetch('/api/entreprise/missions');
    if (!response.ok) {
      throw new Error("Erreur de l'API lors du chargement des missions.");
    }
    
    const { missions } = await response.json();

    // Vider le conteneur avant d'ajouter les nouvelles cartes
    missionsContainer.innerHTML = ''; 

    if (!missions || missions.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      missions.forEach(mission => {
        const card = createMissionCard(mission);
        missionsContainer.appendChild(card);
      });
    }

  } catch (err) {
    console.error("Impossible de charger les missions:", err);
    missionsContainer.innerHTML = "<p>Erreur de chargement des missions. Veuillez réessayer plus tard.</p>";
  }
}


/**
 * Crée une carte HTML pour une mission.
 * @param {object} mission - Les données de la mission.
 * @returns {HTMLElement} L'élément de la carte.
 */
function createMissionCard(mission) {
  const card = document.createElement("article");
  card.className = "ticket-card"; // On réutilise le style des cartes de ticket
  // On ajoute un ID unique à la carte pour la retrouver facilement
  card.id = `mission-${mission.id}`;

  // MODIFICATION : Le statut vient maintenant de la base de données
  // Et on affiche la priorité à la place.
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
 * MODIFIÉ : Gère le clic sur "Accepter la mission".
 * @param {string} missionId 
 */
async function accepterMission(missionId) {
  // Confirmation pour éviter les clics accidentels
  if (!confirm("Voulez-vous vraiment accepter cette mission ? Elle ne sera plus visible pour les autres entreprises.")) {
    return;
  }

  console.log(`Acceptation de la mission ${missionId}...`);

  try {
    // Étape 1 : Appeler l'API pour mettre à jour le statut
    // IMPORTANT : Nous supposons que l'API attend une requête PATCH sur une URL comme celle-ci.
    // L'API devra être créée ou modifiée pour que cela fonctionne.
    const response = await fetch(`/api/entrepriseMissionsHandler`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        missionId: missionId,
        statut: 'en_cours' // On demande à passer le statut à "en_cours"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "La mise à jour du statut a échoué.");
    }

    // Étape 2 : Mettre à jour l'interface utilisateur
    console.log("Mission acceptée avec succès !");
    alert("Mission acceptée ! Vous pouvez la retrouver dans votre tableau de bord.");
    
    // On retire la carte de la liste des missions disponibles
    const cardToRemove = document.getElementById(`mission-${missionId}`);
    if (cardToRemove) {
      cardToRemove.remove();
    }

    // On vérifie si la liste est vide pour afficher le message approprié
    const missionsContainer = document.getElementById("missions-container");
    if (missionsContainer.childElementCount === 0) {
       document.getElementById("empty-state").classList.remove("hidden");
    }

  } catch (err) {
    console.error("Erreur lors de l'acceptation de la mission:", err);
    alert(`Une erreur est survenue: ${err.message}`);
  }
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