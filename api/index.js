const { readdirSync, statSync } = require('fs');
const path = require('path');

// --- Configuration ---
// Dossier contenant les gestionnaires (handlers) d'API.
const HANDLERS_DIR = '_handlers';
// -------------------

// Fonction pour trouver tous les fichiers JS dans un dossier et ses sous-dossiers.
const findJsFiles = (dir) => {
    let files = [];
    const items = readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            // Si c'est un dossier, on explore son contenu.
            files = files.concat(findJsFiles(fullPath));
        } else if (path.extname(item) === '.js') {
            // Si c'est un fichier .js, on l'ajoute à la liste.
            files.push(fullPath);
        }
    }
    return files;
};

// Création d'une table de routage à partir des fichiers trouvés.
// Exemple : 'api/_handlers/auth/login.js' -> 'auth/login'
const handlersPath = path.join(__dirname, HANDLERS_DIR);
const allHandlers = findJsFiles(handlersPath);

const routes = new Map();
for (const handlerFile of allHandlers) {
    // On retire le chemin de base et l'extension .js pour créer la clé de route.
    const routeKey = handlerFile
        .substring(handlersPath.length + 1) // Enlève '/path/to/api/_handlers/'
        .replace(/\\/g, '/') // Remplace les \ par des / (pour Windows)
        .replace(/\.js$/, ''); // Enlève l'extension '.js'
    
    routes.set(routeKey, handlerFile);
}

// Le routeur principal qui sera exécuté par Vercel.
module.exports = async (req, res) => {
    // Grâce à vercel.json, l'URL originale est dans `req.url`.
    // Exemple: pour '.../api/auth/login', req.url sera '/auth/login'.
    const requestPath = req.url.startsWith('/') ? req.url.substring(1) : req.url;

    // On cherche le gestionnaire correspondant dans notre table de routage.
    const handlerPath = routes.get(requestPath);

    if (handlerPath) {
        try {
            // Si on trouve le gestionnaire, on l'importe et on l'exécute.
            const handler = require(handlerPath);
            // On passe la requête (req) et la réponse (res) au gestionnaire.
            return await handler(req, res);
        } catch (error) {
            console.error(`Erreur lors de l'exécution du handler pour [${requestPath}]:`, error);
            res.status(500).json({ error: "Erreur interne du serveur lors de l'exécution du handler." });
        }
    } else {
        // Si aucun gestionnaire n'est trouvé, on renvoie une erreur 404.
        console.error(`Aucun handler trouvé pour la route: ${requestPath}`);
        res.status(404).json({ error: `La route API '${requestPath}' n'a pas été trouvée.` });
    }
};