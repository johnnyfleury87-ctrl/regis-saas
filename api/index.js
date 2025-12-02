// On utilise IMPORT, comme dans vos autres fichiers.
import authHandler from './_handlers/authHandler.js';
import createTicketHandler from './_handlers/createTicketHandler.js';
import entrepriseMissionsHandler from './_handlers/entrepriseMissionsHandler.js';
import locataireProfileHandler from './_handlers/locataireProfileHandler.js';
import regieTicketsHandler from './_handlers/regieTicketsHandler.js';
import updateTicketHandler from './_handlers/updateTicketHandler.js';

// La table de correspondance, comme avant.
const routes = {
  'authHandler': authHandler,
  'createTicketHandler': createTicketHandler,
  'entrepriseMissionsHandler': entrepriseMissionsHandler,
  'locataireProfileHandler': locataireProfileHandler,
  'regieTicketsHandler': regieTicketsHandler,
  'updateTicketHandler': updateTicketHandler,
};

// On exporte par défaut la fonction du routeur principal.
export default async function (req, res) {
  // On récupère le nom de la route demandée, ex: "authHandler"
  // Note: Vercel passe l'URL complète dans req.url, il faut nettoyer.
  const requestPath = req.url.split('?')[0].replace('/api/', '');

  const handler = routes[requestPath];

  if (handler) {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error(`Erreur pour la route [${requestPath}]:`, error);
      res.status(500).json({ error: "Erreur interne du serveur." });
    }
  } else {
    console.error(`Route non trouvée: ${requestPath}`);
    res.status(404).json({ error: `La route API '${requestPath}' est introuvable.` });
  }
};