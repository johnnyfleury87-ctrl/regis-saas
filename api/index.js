// --- Import des "handlers" pour chaque groupe de fonctionnalités ---
import handleRegieTickets from './_handlers/regieTicketsHandler.js';
import handleEntrepriseMissions from './_handlers/entrepriseMissionsHandler.js';
import handleUpdateTicket from './_handlers/updateTicketHandler.js';
import handleAuth from './_handlers/authHandler.js';
import handleLocataireProfile from './_handlers/locataireProfileHandler.js';
import handleCreateTicket from './_handlers/createTicketHandler.js'; // <- NOUVEL AJOUT

/**
 * Routeur API principal.
 */
export default async function handler(req, res) {
  const url = req.url;

  // --- Route pour la création de ticket (locataire) ---
  if (url === '/api/tickets/create') { // <- NOUVELLE ROUTE
    return handleCreateTicket(req, res);
  }

  // --- Routes pour la Régie ---
  if (url.startsWith('/api/regie/tickets?')) {
    return handleRegieTickets(req, res);
  }
  if (url === '/api/regie/tickets/update') {
    return handleUpdateTicket(req, res);
  }

  // --- Routes pour l'Entreprise ---
  if (url === '/api/entreprise/missions') {
    return handleEntrepriseMissions(req, res);
  }

  // --- Routes pour l'Authentification ---
  if (url.startsWith('/api/auth/')) {
    return handleAuth(req, res);
  }

  // --- Routes pour le Locataire ---
  if (url === '/api/locataires/profile') {
    return handleLocataireProfile(req, res);
  }
  
  // Si aucune route ne correspond, renvoyer une erreur 404
  console.warn(`Route API non trouvée pour l'URL: ${url}`);
  res.status(404).json({ error: "Route API non trouvée" });
}