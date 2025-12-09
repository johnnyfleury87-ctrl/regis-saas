const state = {
  techniciens: [],
  userId: null,
  editing: null,
};

const selectors = {};

document.addEventListener("DOMContentLoaded", () => {
  selectors.list = document.getElementById("techniciens-list");
  selectors.empty = document.getElementById("techniciens-empty");
  selectors.openCreate = document.getElementById("open-create");
  selectors.modal = document.getElementById("technicien-modal");
  selectors.form = document.getElementById("technicien-form");
  selectors.cancel = document.getElementById("cancel-modal");
  selectors.modalTitle = document.getElementById("modal-title");
  selectors.modalSubtitle = document.getElementById("modal-subtitle");
  selectors.passwordGroup = document.getElementById("password-group");

  state.userId = localStorage.getItem("userId");
  if (!state.userId) {
    alert("Session expirée. Merci de vous reconnecter.");
    window.location.href = "/login.html";
    return;
  }

  selectors.openCreate.addEventListener("click", () => openModal());
  selectors.cancel.addEventListener("click", closeModal);
  selectors.form.addEventListener("submit", handleSubmit);
  selectors.modal.addEventListener("click", (event) => {
    if (event.target === selectors.modal) {
      closeModal();
    }
  });

  loadTechniciens();
});

async function loadTechniciens() {
  try {
    const response = await fetch("/api/entreprise/techniciens", {
      headers: { "X-User-Id": state.userId },
    });

    if (!response.ok) {
      throw new Error((await response.json()).error || "Chargement impossible");
    }

    const payload = await response.json();
    state.techniciens = Array.isArray(payload.techniciens)
      ? payload.techniciens.filter((tech) => tech.is_active !== false)
      : [];
    renderTechniciens();
  } catch (error) {
    console.error("Récupération techniciens échouée:", error);
    alert("Impossible de récupérer les techniciens : " + error.message);
  }
}

function renderTechniciens() {
  if (!selectors.list) return;

  selectors.list.innerHTML = "";

  if (!state.techniciens.length) {
    selectors.empty?.classList.remove("hidden");
    return;
  }

  selectors.empty?.classList.add("hidden");

  state.techniciens.forEach((tech) => {
    const card = document.createElement("article");
    card.className = "technicien-card";

    const competences = Array.isArray(tech.competences)
      ? tech.competences.filter(Boolean)
      : [];

    card.innerHTML = `
      <header>
        <div>
          <h3>${escapeHtml(tech.nom || tech.display_name || "Technicien")}</h3>
          ${tech.poste ? `<span class="help-text">${escapeHtml(tech.poste)}</span>` : ""}
        </div>
        <span class="status-pill">${escapeHtml((tech.statut || "disponible").toUpperCase())}</span>
      </header>
      <div class="technicien-meta">
        <span>📧 ${escapeHtml(tech.email || "-")}</span>
        <span>📞 ${escapeHtml(tech.telephone || "-")}</span>
      </div>
      ${competences.length
        ? `<div><strong>Compétences</strong><ul>${competences.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul></div>`
        : ""}
      <div class="technicien-actions">
        <button class="btn btn-secondary" data-edit="${tech.id}">Modifier</button>
        <button class="btn btn-danger" data-delete="${tech.id}">Supprimer</button>
      </div>
    `;

    const editBtn = card.querySelector(`[data-edit="${tech.id}"]`);
    const deleteBtn = card.querySelector(`[data-delete="${tech.id}"]`);

    editBtn.addEventListener("click", () => openModal(tech));
    deleteBtn.addEventListener("click", () => deleteTechnicien(tech));

    selectors.list.appendChild(card);
  });
}

function openModal(technicien = null) {
  state.editing = technicien;
  selectors.modal?.classList.remove("hidden");

  selectors.form.reset();
  selectors.form.technicien_id.value = technicien?.id || "";

  if (technicien) {
    selectors.modalTitle.textContent = "Modifier le technicien";
    selectors.modalSubtitle.textContent = "Mettre à jour les informations visibles dans le planning.";
    selectors.form.nom.value = technicien.nom || technicien.display_name || "";
    selectors.form.email.value = technicien.email || "";
    selectors.form.poste.value = technicien.poste || "";
    selectors.form.telephone.value = technicien.telephone || "";
    selectors.form.competences.value = Array.isArray(technicien.competences)
      ? technicien.competences.join(", ")
      : technicien.competences || "";
    selectors.form.statut.value = technicien.statut || "disponible";

    selectors.passwordGroup.classList.add("hidden");
    selectors.form.password.required = false;
  } else {
    selectors.modalTitle.textContent = "Nouveau technicien";
    selectors.modalSubtitle.textContent = "Générez un compte pour votre collaborateur.";
    selectors.passwordGroup.classList.remove("hidden");
    selectors.form.password.value = "";
    selectors.form.password.required = true;
  }
}

function closeModal() {
  selectors.modal?.classList.add("hidden");
  state.editing = null;
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(selectors.form);
  const payload = {
    nom: formData.get("nom").trim(),
    email: formData.get("email").trim(),
    poste: valueOrNull(formData.get("poste")),
    telephone: valueOrNull(formData.get("telephone")),
    competences: normaliseCompetences(formData.get("competences")),
    statut: formData.get("statut") || "disponible",
  };

  const isEdit = Boolean(state.editing);
  const url = "/api/entreprise/techniciens";

  try {
    let response;

    if (isEdit) {
      payload.technicien_id = state.editing.id;
      if (state.editing.email !== payload.email) {
        payload.email = payload.email || null;
      }

      response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": state.userId,
        },
        body: JSON.stringify(payload),
      });
    } else {
      const password = formData.get("password").trim();
      if (!password || password.length < 8) {
        alert("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }

      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": state.userId,
        },
        body: JSON.stringify({ ...payload, password }),
      });
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Enregistrement impossible");
    }

    closeModal();
    await loadTechniciens();
  } catch (error) {
    console.error("Sauvegarde technicien échouée:", error);
    alert(error.message);
  }
}

async function deleteTechnicien(technicien) {
  const confirmation = confirm(`Désactiver ${technicien.nom || technicien.display_name || "ce technicien"} ?`);
  if (!confirmation) return;

  try {
    const response = await fetch("/api/entreprise/techniciens", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": state.userId,
      },
      body: JSON.stringify({ technicien_id: technicien.id }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Suppression impossible");
    }

    await loadTechniciens();
  } catch (error) {
    console.error("Suppression technicien échouée:", error);
    alert(error.message);
  }
}

function valueOrNull(value) {
  const trimmed = (value || "").trim();
  return trimmed.length ? trimmed : null;
}

function normaliseCompetences(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
