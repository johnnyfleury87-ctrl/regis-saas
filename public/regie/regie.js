console.log("Espace régie – script chargé ✓");

/**
 * Redirige vers la page des tickets en ajoutant l'identifiant de la régie.
 * Le regieId est récupéré depuis le localStorage.
 */
function goToTickets() {
  const regieId = localStorage.getItem("regieId");

  if (!regieId) {
    console.error("Impossible de trouver le regieId dans le localStorage.");
    alert("Erreur : Impossible de trouver l'identifiant de votre régie. Veuillez vous reconnecter.");
    return;
  }

  // Redirection vers la page des tickets avec le bon paramètre
  window.location.href = `/regie/tickets.html?regieId=${regieId}`;
}

/**
 * Fonction pour charger et afficher les compteurs de tickets.
 * Cette fonction s'exécute au chargement de la page.
 */
async function loadTicketCounters() {
  const regieId = localStorage.getItem("regieId");
  if (!regieId) return; // Ne fait rien si pas de regieId

  try {
    const url = `/api/regie/tickets?regieId=${encodeURIComponent(regieId)}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Erreur API pour les compteurs:", await response.text());
      return;
    }

    const { tickets } = await response.json();
    if (!tickets) return;

    // Calcul des compteurs
    const enAttente = tickets.filter(t => t.statut === 'en_attente' || t.statut === 'nouveau').length;
    const enCours = tickets.filter(t => t.statut === 'en_cours').length;

    // Mise à jour des badges
    const badgeNew = document.getElementById('badge-new');
    const badgeProgress = document.getElementById('badge-progress');

    if (badgeNew) badgeNew.textContent = enAttente;
    if (badgeProgress) badgeProgress.textContent = enCours;

  } catch (error) {
    console.error("Erreur lors du chargement des compteurs de tickets:", error);
  }
}

// Initialisation des compteurs au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  loadTicketCounters();
});