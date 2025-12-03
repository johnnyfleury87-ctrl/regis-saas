import authHandler from './_handlers/authHandler.js';
import createTicketHandler from './_handlers/createTicketHandler.js';
import entrepriseMissionsHandler from './_handlers/entrepriseMissionsHandler.js';
import locataireProfileHandler from './_handlers/locataireProfileHandler.js';
import regieLocatairesHandler from './_handlers/regieLocatairesHandler.js';
import regieTicketsHandler from './_handlers/regieTicketsHandler.js';
import updateTicketHandler from './_handlers/updateTicketHandler.js';

/**
 * Ce tableau d'objets définit les routes de votre API.
 * Chaque objet contient :
 * - une `path`: l'URL que le client appellera (ex: '/api/auth').
 * - un `handler`: la fonction importée depuis le dossier _handlers qui doit s'exécuter.
 * - une `exact`: `true` si le chemin doit correspondre exactement, `false` pour permettre des sous-chemins (ex: /locataires/profile).
 */
const routes = [
  // Authentication
  { path: 'auth', handler: authHandler, exact: true },

  // Tickets
  { path: 'tickets', handler: createTicketHandler, exact: true }, // Pour POST
  { path: 'tickets/update', handler: updateTicketHandler, exact: true }, // Pour PATCH

  // Locataire (Tenant)
  { path: 'locataires/profile', handler: locataireProfileHandler, exact: false }, // exact: false pour attraper /profile?userId=...

  // Régie (Real estate agency)
  { path: 'regie/locataires', handler: regieLocatairesHandler, exact: false }, // Pour GET et POST
  { path: 'regie/tickets', handler: regieTicketsHandler, exact: false }, // Pour GET avec ?regieId=...

  // Entreprise (Company)
  { path: 'entreprises/missions', handler: entrepriseMissionsHandler, exact: true },
];

export default async function (req, res) {
  // Extrait le chemin de la requête, enlève le préfixe '/api/' et les potentiels slashs au début/fin.
  const requestPath = req.url.split('?')[0].replace('/api/', '').replace(/^\/|\/$/g, '');

  // Trouve la route correspondante dans le tableau `routes`.
  const route = routes.find(r => 
    r.exact ? r.path === requestPath : requestPath.startsWith(r.path)
  );

  if (route && route.handler) {
    try {
      // Exécute le handler associé à la route trouvée.
      return await route.handler(req, res);
    } catch (error) {
      console.error(`Erreur pour la route [${requestPath}]:`, error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  } else {
    // Si aucune route ne correspond, renvoie une erreur 404.
    return res.status(404).json({ error: `Route API introuvable: '${requestPath}'` });
  }
};