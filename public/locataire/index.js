console.log("Locataire: chargement des données…");

// Récupération du userId connecté
const userId = localStorage.getItem("userId");
if (!userId) {
    alert("Session expirée. Merci de vous reconnecter.");
    window.location.href = "/login.html";
}

// Fonction principale
async function loadLocataire() {
    try {
        const res = await fetch(`/api/locataire/details?userId=${userId}`);
        const data = await res.json();

        if (!res.ok) {
            console.error("Erreur API:", data);
            return;
        }

        const profil = data.profil;      // NEW
        const loc = data.details;        // NEW

        // Mise à jour du header (ancien "Locataire Demo")
        document.getElementById("locataire-name").textContent =
            `${profil.display_name || profil.role || ""}`;

        // Mise à jour du widget “Mon logement”
        document.getElementById("lg-address").textContent = loc.address || "-";
        document.getElementById("lg-zipcity").textContent =
            `${loc.zip_code || ""} ${loc.city || ""}`;

        // Mise à jour du loyer
        document.getElementById("lg-rent").textContent = loc.loyer
            ? `${loc.loyer} CHF / mois`
            : "-";

    } catch (err) {
        console.error("Erreur loadLocataire:", err);
    }
}

loadLocataire();

// Déconnexion
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login.html";
});
