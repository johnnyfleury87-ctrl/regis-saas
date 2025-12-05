// On attend que toute la page HTML soit chargée avant d'exécuter notre code.
document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Récupération des éléments de la page ---
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const missionContentDiv = document.getElementById('mission-content');
  const missionDetailsDiv = document.getElementById('mission-details');
  const locataireDetailsDiv = document.getElementById('locataire-details');
  const locataireInfoDiv = document.getElementById('locataire-info');
  const actionButtonContainer = document.getElementById('action-button-container');

  // --- 2. Récupération de l'ID de la mission depuis l'URL ---
  // L'URL doit être /mission-details.html?id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const urlParams = new URLSearchParams(window.location.search);
  const missionId = urlParams.get('id');

  if (!missionId) {
    showError("Erreur : ID de la mission manquant dans l'URL.");
    return; // On arrête tout si pas d'ID
  }

  // --- 3. Fonction principale pour charger les données ---
  async function loadMissionData() {
    // On requête Supabase côté client pour les données de la mission ET du ticket associé
    const { data: mission, error } = await supabase
      .from('missions')
      .select(`
        *,
        tickets ( * )
      `)
      .eq('id', missionId)
      .single(); // .single() car on ne s'attend qu'à un seul résultat

    if (error) {
      showError("Impossible de charger les données de la mission.");
      console.error(error);
      return;
    }
    
    // On masque le chargement et on affiche la zone de contenu
    loadingDiv.style.display = 'none';
    missionContentDiv.style.display = 'block';

    // On affiche les détails de la mission et du ticket
    displayMissionDetails(mission);
    
    // On vérifie le statut pour décider quoi afficher ensuite
    const isAccepted = mission.statut === 'acceptée';

    if (isAccepted) {
      // Si la mission est déjà acceptée, on cherche et affiche les infos du locataire
      loadAndDisplayLocataireDetails(mission.tickets.locataire_id);
    } else {
      // Sinon, on affiche le bouton pour pouvoir l'accepter
      displayAcceptButton();
    }
  }

  // --- 4. Fonctions d'affichage ---

  // Affiche les détails de base de la mission et du ticket
  function displayMissionDetails(mission) {
    const ticket = mission.tickets;
    missionDetailsDiv.innerHTML = `
      <h2>Détails du Ticket</h2>
      <p><strong>Statut Mission :</strong> ${mission.statut}</p>
      <p><strong>Catégorie :</strong> ${ticket.categorie || 'Non précisé'}</p>
      <p><strong>Pièce :</strong> ${ticket.piece || 'Non précisé'}</p>
      <p><strong>Détail :</strong> ${ticket.detail || 'Non précisé'}</p>
      <p><strong>Description :</strong></p>
      <p>${ticket.description || 'Aucune description'}</p>
    `;
  }

  // Affiche le bouton "Accepter la mission"
  function displayAcceptButton() {
    actionButtonContainer.innerHTML = `<button id="accept-btn">Accepter la mission</button>`;
    const acceptBtn = document.getElementById('accept-btn');
    // On attache un événement au clic sur ce bouton
    acceptBtn.addEventListener('click', handleAcceptMission);
  }
  
  // Charge et affiche les informations du locataire
  async function loadAndDisplayLocataireDetails(locataireId) {
    if(!locataireId) {
        locataireDetailsDiv.style.display = 'block';
        locataireInfoDiv.innerHTML = "<p>Aucun locataire associé à ce ticket.</p>";
        return;
    }

    const { data: locataire, error } = await supabase
      .from('locataires_details')
      .select('*')
      .eq('user_id', locataireId)
      .single();
    
    if (error || !locataire) {
      locataireInfoDiv.innerHTML = "<p>Impossible de charger les informations du locataire.</p>";
      console.error(error);
    } else {
      locataireInfoDiv.innerHTML = `
        <p><strong>Nom :</strong> ${locataire.prenom || ''} ${locataire.nom || ''}</p>
        <p><strong>Email :</strong> ${locataire.email || 'Non communiqué'}</p>
        <p><strong>Adresse :</strong> ${locataire.address || ''}, ${locataire.zip_code || ''} ${locataire.city || ''}</p>
        <p><strong>Digicode :</strong> ${locataire.building_code || 'Non communiqué'}</p>
        <p><strong>Appartement :</strong> ${locataire.apartment || 'Non communiqué'}</p>
      `;
    }
    // On affiche la section des détails du locataire
    locataireDetailsDiv.style.display = 'block';
  }

  // --- 5. Fonction pour gérer l'action d'accepter ---
  async function handleAcceptMission() {
    const acceptBtn = document.getElementById('accept-btn');
    acceptBtn.disabled = true;
    acceptBtn.textContent = 'Acceptation en cours...';

    // On appelle notre nouvelle API endpoint
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
      showError(result.error || "Une erreur est survenue lors de l'acceptation.");
      acceptBtn.disabled = false;
      acceptBtn.textContent = 'Accepter la mission';
    } else {
      // Succès ! La solution la plus simple est de recharger la page.
      // La page se rechargera et affichera maintenant les infos du locataire.
      alert('Mission acceptée avec succès !');
      window.location.reload();
    }
  }

  // --- Utilitaire pour afficher les erreurs ---
  function showError(message) {
    loadingDiv.style.display = 'none';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  // --- Démarrage ---
  loadMissionData();

});