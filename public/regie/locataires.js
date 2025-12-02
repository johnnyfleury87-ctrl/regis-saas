console.log("locataires.js chargé ✓");

// === Sélecteurs ===
const tbody = document.getElementById("locataires-tbody");
const emptyState = document.getElementById("locataires-empty");
const countLabel = document.getElementById("locataires-count");

// Formulaire
const form = document.getElementById("locataire-form");
const idField = document.getElementById("locataire-id");
const prenomField = document.getElementById("prenom");
const nomField = document.getElementById("nom");
const emailField = document.getElementById("email");
const adresseField = document.getElementById("adresse");
const loyerField = document.getElementById("loyer");
const passwordField = document.getElementById("password");

const submitBtn = document.getElementById("submit-btn");
const resetBtn = document.getElementById("reset-btn");
const refreshBtn = document.getElementById("refresh-btn");

const csvInput = document.getElementById("csvInput");
const importBtn = document.getElementById("import-btn");
const formTitle = document.getElementById("form-title");

// Récupération regie Id
const regieId = localStorage.getItem("regieId");
if (!regieId) {
  alert("Impossible de déterminer la régie. Merci de vous reconnecter.");
  window.location.href = "/login.html";
}

// === UI ===
function setFormModeCreate() {
  idField.value = "";
  submitBtn.textContent = "Créer le locataire";
  formTitle.textContent = "Nouveau locataire";
}

function setFormModeEdit() {
  submitBtn.textContent = "Mettre à jour le locataire";
  formTitle.textContent = "Modifier le locataire";
}

function resetForm() {
  form.reset();
  setFormModeCreate();
}

resetBtn.addEventListener("click", resetForm);

// ======================================================
// CHARGEMENT LISTE LOCATAIRES
// ======================================================
async function loadLocataires() {
  tbody.innerHTML = "";
  emptyState.style.display = "none";
  countLabel.textContent = "Chargement...";

  try {
    const res = await fetch(`/api/regie/locataires?regieId=${encodeURIComponent(regieId)}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Erreur API list:", data);
      alert("Impossible de charger les locataires.");
      return;
    }

    const locataires = data.locataires || [];

    if (!locataires.length) {
      emptyState.style.display = "block";
      countLabel.textContent = "0 locataire";
      return;
    }

    countLabel.textContent =
      locataires.length === 1 ? "1 locataire" : `${locataires.length} locataires`;

    for (const loc of locataires) {
      const tr = document.createElement("tr");

      const nomComplet = [loc.prenom, loc.nom].filter(Boolean).join(" ");
      const logement = loc.address || "-";
      const loyer = loc.loyer != null ? `${loc.loyer} CHF` : "-";

      tr.innerHTML = `
        <td>${nomComplet || "-"}</td>
        <td>${loc.email || "-"}</td>
        <td>${logement}</td>
        <td><span class="tag-loyer">${loyer}</span></td>
        <td>
          <button class="btn btn-outline btn-sm edit-btn">Éditer</button>
          <button class="btn btn-danger btn-sm delete-btn">Supprimer</button>
        </td>
      `;

      tr.dataset.locataire = JSON.stringify(loc);
      tbody.appendChild(tr);
    }

    bindRowEvents();

  } catch (err) {
    console.error("Erreur chargement locataires:", err);
    alert("Erreur lors du chargement des locataires.");
  }
}

function bindRowEvents() {
  const rows = tbody.querySelectorAll("tr");

  rows.forEach(tr => {
    const loc = JSON.parse(tr.dataset.locataire);

    const editBtn = tr.querySelector(".edit-btn");
    const deleteBtn = tr.querySelector(".delete-btn");

    editBtn.addEventListener("click", () => {
      idField.value = loc.user_id;  // IMPORTANT !!
      prenomField.value = loc.prenom || "";
      nomField.value = loc.nom || "";
      emailField.value = loc.email || "";
      adresseField.value = loc.address || "";
      loyerField.value = loc.loyer || "";
      passwordField.value = "";

      setFormModeEdit();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Supprimer le locataire "${loc.email}" ?`)) return;

      try {
        const res = await fetch("/api/index.js", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regieId,
            locataireId: loc.user_id,
            userId: loc.user_id
          })
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("Erreur delete:", data);
          alert(data.error || "Suppression impossible.");
          return;
        }

        await loadLocataires();

      } catch (err) {
        console.error("Erreur delete:", err);
        alert("Erreur lors de la suppression.");
      }
    });
  });
}

refreshBtn.addEventListener("click", loadLocataires);

// ======================================================
// SUBMIT FORMULAIRE
// ======================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    regieId,
    locataireId: idField.value || null,
    prenom: prenomField.value.trim(),
    nom: nomField.value.trim(),
    email: emailField.value.trim(),
    adresse: adresseField.value.trim(),
    loyer: loyerField.value ? parseFloat(loyerField.value) : null,
    password: passwordField.value.trim()
  };

  if (!payload.email || (!payload.locataireId && !payload.password)) {
    alert("Email et mot de passe obligatoires (en création).");
    return;
  }

  const method = payload.locataireId ? "PUT" : "POST";

  try {
    submitBtn.disabled = true;

    const res = await fetch("/api/regie/locataires", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Erreur save:", data);
      alert(data.error || "Enregistrement impossible.");
      return;
    }

    resetForm();
    await loadLocataires();

  } catch (err) {
    console.error("Erreur save:", err);
    alert("Erreur lors de l'enregistrement.");
  } finally {
    submitBtn.disabled = false;
  }
});

// ======================================================
// IMPORT CSV
// ======================================================
importBtn.addEventListener("click", async () => {
  const file = csvInput.files?.[0];
  if (!file) {
    alert("Choisis un fichier CSV d'abord.");
    return;
  }

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);

    if (!lines.length) return alert("Fichier vide.");

    const header = lines[0].split(";");
    const idxEmail = header.indexOf("email");
    const idxPrenom = header.indexOf("prenom");
    const idxNom = header.indexOf("nom");
    const idxAdresse = header.indexOf("adresse");
    const idxLoyer = header.indexOf("loyer");
    const idxPassword = header.indexOf("password");

    const records = lines.slice(1).map(line => {
      const cols = line.split(";");
      return {
        email: cols[idxEmail]?.trim(),
        prenom: cols[idxPrenom]?.trim() || "",
        nom: cols[idxNom]?.trim() || "",
        adresse: cols[idxAdresse]?.trim() || "",
        loyer: idxLoyer !== -1 ? parseFloat(cols[idxLoyer]) : null,
        password: cols[idxPassword]?.trim()
      };
    });

    const valid = records.filter(r => r.email && r.password);

    const res = await fetch("/api/index.js", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regieId, locataires: valid })
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Import impossible.");
      return;
    }

    csvInput.value = "";
    await loadLocataires();

  } catch (err) {
    console.error("Erreur CSV:", err);
    alert("Erreur lors de l'import.");
  }
});

// Chargement initial
loadLocataires();
