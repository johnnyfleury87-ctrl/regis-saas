import authHandler from './_handlers/authHandler.js';
import createTicketHandler from './_handlers/createTicketHandler.js';
import locataireProfileHandler from './_handlers/locataireProfileHandler.js';
import regieLocatairesHandler from './_handlers/regieLocatairesHandler.js';
// importez les autres handlers ici...

const routes = {
  // Le nom de la route que le client appelle => le handler à exécuter
  'authHandler': authHandler,
  'createTicketHandler': createTicketHandler,
  'locataireProfileHandler': locataireProfileHandler,
  'regieLocatairesHandler': regieLocatairesHandler,
};

export default async function (req, res) {
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
    res.status(404).json({ error: `Route API introuvable: '${requestPath}'` });
  }
};