// On importe chaque handler que vous avez créé.
const authHandler = require('./_handlers/authHandler');
const createTicketHandler = require('./_handlers/createTicketHandler');
const entrepriseMissionsHandler = require('./_handlers/entrepriseMissionsHandler');
const locataireProfileHandler = require('./_handlers/locataireProfileHandler');
const regieTicketsHandler = require('./_handlers/regieTicketsHandler');
const updateTicketHandler = require('./_handlers/updateTicketHandler');

// On crée une correspondance simple entre le nom de la route et le handler.
const routes = {
  'authHandler': authHandler,
  'createTicketHandler': createTicketHandler,
  'entrepriseMissionsHandler': entrepriseMissionsHandler,
  'locataireProfileHandler': locataireProfileHandler,
  'regieTicketsHandler': regieTicketsHandler,
  'updateTicketHandler': updateTicketHandler,
  // Ajoutez d'autres routes ici si vous ajoutez des handlers
};

// Le routeur principal (inchangé par rapport à ma dernière proposition)
module.exports = async (req, res) => {
  // On récupère le nom de la route depuis l'URL, ex: "authHandler"
  const requestPath = req.url.split('?')[0].substring(1);

  // On cherche le handler correspondant dans notre objet.
  const handler = routes[requestPath];

  if (handler) {
    try {
      // Si on le trouve, on l'exécute.
      return await handler(req, res);
    } catch (error) {
      console.error(`Erreur pour la route [${requestPath}]:`, error);
      res.status(500).json({ error: "Erreur interne du serveur." });
    }
  } else {
    // Sinon, c'est une erreur 404.
    console.error(`Route non trouvée: ${requestPath}`);
    res.status(404).json({ error: `La route API '${requestPath}' est introuvable.` });
  }
};