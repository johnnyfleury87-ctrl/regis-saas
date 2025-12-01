console.log("Espace locataire chargé ✓");

// ----------------------------------------------
// 1. Chargement profil locataire
// ----------------------------------------------
async function loadLocataireProfile() {
  const userId = localStorage.getItem("userId");
  if (!userId) return (window.location.href = "/login.html");

  try {
    const res = await fetch(`/api/locataires/profile?userId=${encodeURIComponent(userId)}`);

    const data = await res.json();

    const profil = data.profil || {};
    const details = data.details || {};

    // Nom
    const nomElt = document.getElementById("locataire-nom");
    if (nomElt)
      nomElt.textContent =
        [details.prenom, details.nom].filter(Boolean).join(" ") ||
        profil.display_name ||
        "Locataire";

    // Adresse
    const adr = document.getElementById("loc-adresse");
    if (adr)
      adr.textContent =
        `${details.address || ""}, ${details.zip_code || ""} ${details.city || ""}`.trim();

    // Loyer
    const loyerElt = document.getElementById("loc-loyer");
    if (loyerElt)
      loyerElt.textContent = details.loyer
        ? `${details.loyer} CHF / mois`
        : "Non renseigné";
  } catch (err) {
    console.error("Erreur profil :", err);
  }
}

// ----------------------------------------------
// 2. Arborescence des problèmes
// ----------------------------------------------

const problems = {
  "Plomberie": {
    "Cuisine": ["Fuite évier", "Siphon bouché", "Pression faible", "Autre"],
    "Salle de bain": ["Fuite lavabo", "Joint douche HS", "Siphon bouché", "Autre"],
    "WC": ["WC bouché", "Chasse d’eau cassée", "Autre"]
  },

  "Électricité": {
    "Cuisine": ["Prise HS", "Lampe cassée", "Plaque disjoncte", "Autre"],
    "Salon": ["Interrupteur HS", "Lumière clignotante", "Autre"],
    "Chambre": ["Lampe ne fonctionne plus", "Interrupteur HS", "Autre"]
  },

  "Chauffage": {
    "Radiateur": ["Radiateur froid", "Fuite radiateur", "Autre"],
    "Chaudière": ["Plus d'eau chaude", "Chaudière en panne", "Autre"]
  },

  "Serrurerie": {
    "Porte d'entrée": ["Serrure bloquée", "Clé tourne dans le vide", "Autre"],
    "Fenêtre": ["Poignée cassée", "Fenêtre ferme mal", "Autre"]
  },

  "Autre": {
    "Autre": ["Autre"]
  }
};

// Mappage éléments HTML
const categorySelect = document.getElementById("category");
const roomSelect = document.getElementById("room");
const detailSelect = document.getElementById("detail");
const otherDetailWrapper = document.getElementById("other-detail-wrapper");
const otherDetailInput = document.getElementById("other-detail");

// ----------------------------------------------
// 3. Remplissage des catégories
// ----------------------------------------------
function populateCategories() {
  Object.keys(problems).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// ----------------------------------------------
// 4. Sélection Catégorie → Pièces
// ----------------------------------------------
categorySelect.addEventListener("change", () => {
  roomSelect.innerHTML = "<option value=''>Sélectionnez…</option>";
  detailSelect.innerHTML = "<option value=''>Sélectionnez…</option>";
  otherDetailWrapper.style.display = "none";

  const cat = categorySelect.value;
  if (!cat) return;

  Object.keys(problems[cat]).forEach(piece => {
    const opt = document.createElement("option");
    opt.value = piece;
    opt.textContent = piece;
    roomSelect.appendChild(opt);
  });
});

// ----------------------------------------------
// 5. Sélection Pièce → Détails
// ----------------------------------------------
roomSelect.addEventListener("change", () => {
  detailSelect.innerHTML = "<option value=''>Sélectionnez…</option>";
  otherDetailWrapper.style.display = "none";

  const cat = categorySelect.value;
  const piece = roomSelect.value;

  if (!cat || !piece) return;

  problems[cat][piece].forEach(det => {
    const opt = document.createElement("option");
    opt.value = det;
    opt.textContent = det;
    detailSelect.appendChild(opt);
  });
});

// ----------------------------------------------
// 6. Afficher champ Autre si sélectionné
// ----------------------------------------------
detailSelect.addEventListener("change", () => {
  if (detailSelect.value === "Autre") {
    otherDetailWrapper.style.display = "block";
  } else {
    otherDetailWrapper.style.display = "none";
    otherDetailInput.value = "";
  }
});

// ----------------------------------------------
// 7. Envoi du formulaire
// ----------------------------------------------
const form = document.getElementById("ticket-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userId = localStorage.getItem("userId");

  const finalDetail =
    detailSelect.value === "Autre"
      ? otherDetailInput.value.trim()
      : detailSelect.value;

  const payload = {
    locataire_id: userId,
    categorie: categorySelect.value,
    piece: roomSelect.value,
    detail: finalDetail,
    description: document.getElementById("description").value.trim(),
    dispo1: document.getElementById("dispo1").value,
    dispo2: document.getElementById("dispo2").value || null,
    dispo3: document.getElementById("dispo3").value || null,
    statut: "en_attente"
  };

  const res = await fetch("/api/tickets/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

const out = await res.json();

if (!res.ok) {
    const message = out.error || "Une erreur est survenue lors de l’envoi du ticket.";
    alert("Erreur : " + message);
    return;
}

alert("Votre demande a été envoyée avec succès !");
form.reset();

});

// ----------------------------------------------
// 8. Déconnexion
// ----------------------------------------------
document.getElementById("logout-btn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

// ----------------------------------------------
// 9. Init
// ----------------------------------------------
populateCategories();
loadLocataireProfile();
