import authHandler from './_handlers/authHandler.js';
import createTicketHandler from './_handlers/createTicketHandler.js';
import entrepriseMissionsHandler from './_handlers/entrepriseMissionsHandler.js';
import locataireProfileHandler from './_handlers/locataireProfileHandler.js';
import regieLocatairesHandler from './_handlers/regieLocatairesHandler.js';
import regieTicketsHandler from './_handlers/regieTicketsHandler.js';
import updateTicketHandler from './_handlers/updateTicketHandler.js';
// >>> NOTRE NOUVEL IMPORT <<<
import updateMissionStatusHandler from './_handlers/updateMissionStatusHandler.js';
import getMissionDetailsHandler from './_handlers/getMissionDetailsHandler.js';
import acceptTicketHandler from './_handlers/acceptTicketHandler.js'; // Nouvel import
/**
 * Ce tableau associe les noms de routes (exactement comme appelés par le client)
 * aux fonctions handlers correspondantes.
 */
const routes = {
  'auth': authHandler,
  'tickets': createTicketHandler,
  'tickets/update': updateTicketHandler,
  'locataires/profile': locataireProfileHandler,
  'regie/locataires': regieLocatairesHandler,
  'regie/tickets': regieTicketsHandler,
  'entreprise/missions': entrepriseMissionsHandler,
  // >>> NOTRE NOUVELLE ROUTE <<<
  'entreprise/missions/update': updateMissionStatusHandler,
'entreprise/mission-details': getMissionDetailsHandler,
  // Compatibilité avec les anciens appels (si nécessaire)
  // Si votre client appelait /api/authHandler, décommentez la ligne ci-dessous
  'authHandler': authHandler,
  'locataireProfileHandler': locataireProfileHandler,
  'createTicketHandler': createTicketHandler,
};

export default async function (req, res) {
  // Extrait le chemin de la requête, enlève le préfixe '/api/'
  const requestPath = req.url.split('?')[0].replace('/api/', '');

  // Trouve le handler correspondant au chemin demandé
  const handler = routes[requestPath];

  if (handler) {
    try {
      // Exécute le handler trouvé
      return await handler(req, res);
    } catch (error) {
      console.error(`Erreur pour la route [${requestPath}]:`, error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  } else {
    // Si aucun handler n'est trouvé pour ce chemin, renvoie une erreur 404.
    return res.status(404).json({ error: `Route API introuvable: '${requestPath}'` });
  }
};