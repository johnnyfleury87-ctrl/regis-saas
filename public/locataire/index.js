console.log("Locataire: chargement des données…");

const userId = localStorage.getItem("userId");
if (!userId) {
    alert("Session expirée. Merci de vous reconnecter.");
    window.location.href = "/login.html";
}

async function loadLocataire() {
    try {
        // --- CORRECTION ICI ---
        // L'URL correcte pour appeler votre handler de profil
        const res = await fetch(`/api/locataireProfileHandler?userId=${userId}`);
        // --- FIN DE LA CORRECTION ---

        const data = await res.json();

        if (!res.ok) {
            console.error("Erreur API:", data.error);
            // On n'affiche plus d'alerte, la console suffit pour le débogage
            return;
        }

        const loc = data.locataire;

        document.getElementById("locataire-name").textContent = `${loc.prenom || ""} ${loc.nom || ""}`;
        document.getElementById("lg-address").textContent = loc.address || "-";
        document.getElementById("lg-zipcity").textContent = `${loc.zip_code || ""} ${loc.city || ""}`;
        document.getElementById("lg-rent").textContent = loc.loyer ? `${loc.loyer} CHF / mois` : "-";

    } catch (err) {
        console.error("Erreur dans loadLocataire:", err);
    }
}

loadLocataire();

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login.html";
});