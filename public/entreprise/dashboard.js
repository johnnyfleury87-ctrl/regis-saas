/**
 * Script pour le tableau de bord de l'entreprise.
 * Gère l'affichage de la notification pour les nouvelles missions.
 * Fichier : /public/entreprise/dashboard.js
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Dashboard entreprise initialisé.");
  const bubble = document.getElementById("missions-count-bubble");

  // Si l'élément de la bulle n'existe pas sur la page, on ne fait rien.
  if (!bubble) {
    console.warn("Élément 'missions-count-bubble' non trouvé.");
    return;
  }

  try {
    // On appelle la même API que la page des missions
    const response = await fetch('/api/entreprise/missions');
    
    // On ne bloque pas la page si l'appel échoue, on ignore juste la bulle
    if (!response.ok) return;

    const { missions } = await response.json();
    const count = missions ? missions.length : 0;

    // Si il y a au moins une mission, on affiche la bulle avec le nombre
    if (count > 0) {
      bubble.textContent = count;
      bubble.classList.remove("hidden");
    } else {
      bubble.classList.add("hidden");
    }
  } catch (err) {
    console.error("Impossible de récupérer le nombre de missions pour la notification:", err);
    // On s'assure que la bulle est cachée en cas d'erreur
    bubble.classList.add("hidden");
  }
});