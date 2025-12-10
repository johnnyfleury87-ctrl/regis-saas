import authHandler from "./_handlers/authHandler.js";
import createTicketHandler from "./_handlers/createTicketHandler.js";
import entrepriseMissionsHandler from "./_handlers/entrepriseMissionsHandler.js";
import locataireProfileHandler from "./_handlers/locataireProfileHandler.js";
import locataireTicketsHandler from "./_handlers/locataireTicketsHandler.js";
import locataireNotificationsHandler from "./_handlers/locataireNotificationsHandler.js";
import regieLocatairesHandler from "./_handlers/regieLocatairesHandler.js";
import regieTicketsHandler from "./_handlers/regieTicketsHandler.js";
import updateTicketHandler from "./_handlers/updateTicketHandler.js";
import acceptTicketHandler from "./_handlers/acceptTicketHandler.js";
import getMissionDetailsHandler from "./_handlers/getMissionDetailsHandler.js";
import updateMissionStatusHandler from "./_handlers/updateMissionStatusHandler.js";
import entrepriseTechniciensHandler from "./_handlers/entrepriseTechniciensHandler.js";
import missionAssignationHandler from "./_handlers/missionAssignationHandler.js";
import technicienMissionsHandler from "./_handlers/technicienMissionsHandler.js";
import missionOrderHandler from "./_handlers/missionOrderHandler.js";
import devCreateUserHandler from "./_handlers/devCreateUserHandler.js";

/**
 * Ce tableau associe les noms de routes (exactement comme appelés par le client)
 * aux fonctions handlers correspondantes.
 */
const routes = {
  "auth": authHandler,
  "tickets": createTicketHandler,
  "tickets/update": updateTicketHandler,
  "locataires/profile": locataireProfileHandler,
  "locataires/tickets": locataireTicketsHandler,
  "locataires/notifications": locataireNotificationsHandler,
  "regie/locataires": regieLocatairesHandler,
  "regie/tickets": regieTicketsHandler,

  // Entreprise : liste missions
  "entreprise/missions": entrepriseMissionsHandler,
  "entreprise/techniciens": entrepriseTechniciensHandler,
  "entreprise/missions/assign": missionAssignationHandler,
  "entreprise/missions/order": missionOrderHandler,
  "technicien/missions": technicienMissionsHandler,
  "dev/create-user": devCreateUserHandler,

  // Entreprise : accepter un ticket → créer mission
  "entreprise/missions/update": acceptTicketHandler,

  // Détails d'une mission
  "entreprise/mission-details": getMissionDetailsHandler,

  // Mise à jour de statut d'une mission (si tu l'utilises)
  "entreprise/missions/status": updateMissionStatusHandler,

  // Compatibilité ancienne
  "authHandler": authHandler,
  "locataireProfileHandler": locataireProfileHandler,
  "locataireTicketsHandler": locataireTicketsHandler,
  "createTicketHandler": createTicketHandler,
};

export default async function (req, res) {
  const requestPath = req.url.split("?")[0].replace("/api/", "");
  const handler = routes[requestPath];

  if (handler) {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error(`Erreur pour la route [${requestPath}]:`, error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  } else {
    return res
      .status(404)
      .json({ error: `Route API introuvable: '${requestPath}'` });
  }
}
