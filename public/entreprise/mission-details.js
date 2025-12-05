// Attend que le DOM soit entièrement chargé pour exécuter le script
document.addEventListener('DOMContentLoaded', () => {

  // Récupération des éléments du DOM
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const missionContentDiv = document.getElementById('mission-content');
  const missionDetailsDiv = document.getElementById('mission-details');
  const locataireDetailsDiv = document.getElementById('locataire-details');
  const locataireInfoDiv = document.getElementById('locataire-info');
  const actionButtonContainer = document.getElementById('action-button-container');

  // Récupère l'ID de la mission depuis les paramètres de l'URL (ex: ?id=xxxx)
  const urlParams = new URLSearchParams(window.location.search);
  const missionId = urlParams.get('id');

  // Si pas d'ID, on affiche une erreur et on arrête tout
  if (!missionId) {
    showError("ID de la mission manquant dans l'URL.");
    return;
  }

  // Fonction principale pour récupérer et afficher la mission
  async function loadMission() {
    // On récupère la mission ET le ticket associé en une seule requête
    const { data: mission, error } = await supabase
      .from('missions')
      .select(`
        *,
        tickets (
          *,
          locataire_id
        )
      `)
      .eq('id', missionId)
      .single();

    if (error) {
      showError("Impossible de charger la mission.");
      console.error(error);
      return;
    }
    
    // On cache le chargement et on affiche le contenu
    loadingDiv.style.display = 'none';
    missionContentDiv.style.display = 'block';

    // On affiche les détails de la mission
    displayMissionDetails(mission);
    
    // On regarde si la mission est acceptée ou non
    const isAccepted = mission.statut === 'acceptée';

    if (isAccepted) {
      // Si elle est acceptée, on charge et on affiche les infos du locataire
      loadAndDisplayLocataireDetails(mission.tickets.locataire_id);
    } else {
      // Sinon, on affiche le bouton pour accepter
      displayAcceptButton(mission.id);
    }
  }

  // Fonction pour afficher les infos de base de la mission et du ticket
  function displayMissionDetails(mission) {
    const ticket = mission.tickets;
    missionDetailsDiv.innerHTML = `
      <h2>Ticket #${ticket.id.substring(0, 8)}</h2>
      <p><strong>Statut :</strong> ${mission.statut}</p>
      <p><strong>Catégorie :</strong> ${ticket.categorie}</p>
      <p><strong>Pièce :</strong> ${ticket.piece}</p>
      <p><strong>Détail :</strong> ${ticket.detail}</p>
      <p><strong>Description :</strong> ${ticket.description}</p>
      <p><strong>Urgence :</strong> ${ticket.urgence}</p>
    `;
  }

  // Fonction qui affiche le bouton "Accepter"
  function displayAcceptButton(missionId) {
    actionButtonContainer.innerHTML = `<button id="accept-btn">Accepter la mission</button>`;
    const acceptBtn = document.getElementById('accept-btn');
    acceptBtn.addEventListener('click', () => handleAcceptMission(missionId));
  }
  
  // Fonction appelée au clic sur le bouton
  async function handleAcceptMission(missionId) {
    const acceptBtn = document.getElementById('accept-btn');
    acceptBtn.disabled = true;
    acceptBtn.textContent = 'Acceptation en cours...';

    // On appelle notre API backend
    const response = await fetch('/api/update-mission-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_id: missionId, new_status: 'acceptée' })
    });

    const result = await response.json();

    if (!response.ok) {
      showError(result.error || "Une erreur s'est produite.");
      acceptBtn.disabled = false;
      acceptBtn.textContent = 'Accepter la mission';
    } else {
      // Succès ! On rafraîchit la page pour voir les changements
      // (c'est le plus simple pour tout mettre à jour)
      window.location.reload();
    }
  }

  // Fonction pour charger et afficher les détails du locataire
  async function loadAndDisplayLocataireDetails(locataireId) {
    const { data: locataire, error } = await supabase
      .from('locataires_details')
      .select('*')
      .eq('user_id', locataireId)
      .single();
    
    if (error || !locataire) {
      locataireInfoDiv.innerHTML = "<p>Impossible de charger les informations du locataire.</p>";
      console.error(error);
      return;
    }

    locataireInfoDiv.innerHTML = `
      <p><strong>Nom :</strong> ${locataire.prenom} ${locataire.nom}</p>
      <p><strong>Email :</strong> ${locataire.email}</p>
      <p><strong>Adresse :</strong> ${locataire.address}, ${locataire.zip_code} ${locataire.city}</p>
      <p><strong>Code Immeuble :</strong> ${locataire.building_code}</p>
      <p><strong>Appartement :</strong> ${locataire.apartment}</p>
    `;
    locataireDetailsDiv.style.display = 'block';
  }

  // Utilitaire pour afficher les erreurs
  function showError(message) {
    loadingDiv.style.display = 'none';
    errorDiv.textContent = message;
  }

  // On lance le chargement de la mission
  loadMission();

});