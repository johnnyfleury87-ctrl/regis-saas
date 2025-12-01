// locataire.js

console.log("Espace locataire chargé ✓");

// -----------------------------------------------------------------------------
// 1. Chargement des infos locataire depuis l’API /api/locataire/profile
// -----------------------------------------------------------------------------

async function loadLocataireProfile() {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    console.warn("Aucun userId dans localStorage → retour login");
    window.location.href = "/login.html";
    return;
  }

  try {
    const res = await fetch(`/api/locataire/profile?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Erreur API profil locataire :", data);
      return;
    }

    const profil = data.profil || {};
    const details = data.details || {};

    // Nom affiché en haut à droite
    const nomElt = document.getElementById("locataire-nom");
    if (nomElt) {
      const fullName = [details.prenom, details.nom].filter(Boolean).join(" ");
      nomElt.textContent = fullName || profil.display_name || "Locataire";
    }

    // Adresse
    const adresseElt = document.getElementById("loc-adresse");
    if (adresseElt) {
      const adresse = details.address || "";
      const zip = details.zip_code || "";
      const city = details.city || "";

      let ligne = "Adresse non renseignée";
      if (adresse || zip || city) {
        const parts = [];
        if (adresse) parts.push(adresse);
        const cityPart = [zip, city].filter(Boolean).join(" ");
        if (cityPart) parts.push(cityPart);
        ligne = parts.join(", ");
      }
      adresseElt.textContent = ligne;
    }

    // Loyer
    const loyerElt = document.getElementById("loc-loyer");
    if (loyerElt) {
      if (typeof details.loyer === "number") {
        loyerElt.textContent = `${details.loyer} CHF / mois`;
      } else if (details.loyer) {
        // au cas où ce soit du texte
        loyerElt.textContent = `${details.loyer} CHF / mois`;
      } else {
        loyerElt.textContent = "Non renseigné";
      }
    }

  } catch (err) {
    console.error("Erreur JS loadLocataireProfile :", err);
  }
}

// -----------------------------------------------------------------------------
// 2. Gestion du formulaire de ticket (ton ancien code, conservé)
// -----------------------------------------------------------------------------

const form = document.getElementById("ticket-form");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = document.getElementById("category").value;
    const room = document.getElementById("room").value;
    const urgency = document.getElementById("urgency").value;
    const description = document.getElementById("description").value.trim();
    const availability1 = document.getElementById("availability1")?.value || "";
    const availability2 = document.getElementById("availability2")?.value || "";

    console.log("NOUVEAU TICKET LOCATAIRE ►", {
      category,
      room,
      urgency,
      description,
      availability1,
      availability2
    });

    // Plus tard : appel à l'API de création de tickets
    // fetch("/api/tickets/create", { method: "POST", body: JSON.stringify(...) })

    alert(
      "Votre demande d’intervention a été enregistrée.\n" +
      "Pour l’instant, c’est une simulation (pas encore connecté à l’API)."
    );

    form.reset();
  });
}

// -----------------------------------------------------------------------------
// 3. Déconnexion
// -----------------------------------------------------------------------------

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    // On nettoie un minimum
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("regieId");
    localStorage.removeItem("entrepriseId");
    window.location.href = "/login.html";
  });
}

// -----------------------------------------------------------------------------
// 4. Lancement au chargement de la page
// -----------------------------------------------------------------------------

loadLocataireProfile();
