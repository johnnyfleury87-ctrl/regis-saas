document.addEventListener("DOMContentLoaded", () => {
  const dom = {
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    content: document.getElementById("mission-content"),
    details: document.getElementById("mission-details"),
    locataireSection: document.getElementById("locataire-details"),
    locataireInfo: document.getElementById("locataire-info"),
    assignmentSection: document.getElementById("assignment-section"),
    assignmentContent: document.getElementById("assignment-content"),
    actionButtons: document.getElementById("action-button-container"),
  };

  const state = {
    missionId: new URLSearchParams(window.location.search).get("id"),
    userId: localStorage.getItem("userId"),
    mission: null,
    techniciens: [],
    activeAssignation: null,
  };

  if (!state.missionId) {
    return showError("Mission introuvable. Identifiant manquant.");
  }

  if (!state.userId) {
    alert("Session expirée. Merci de vous reconnecter.");
    window.location.href = "/login.html";
    return;
  }

  loadPage();

  async function loadPage() {
    try {
      dom.error.style.display = "none";
      dom.content.style.display = "none";
      dom.loading.style.display = "block";

      await loadMission();
      await loadTechniciens();

      dom.loading.style.display = "none";
      dom.content.style.display = "block";

      renderMission();
      renderLocataire();
      renderAssignment();
      renderActions();
    } catch (error) {
      console.error("Chargement mission échoué:", error);
      showError(error.message || "Erreur lors du chargement de la mission.");
    }
  }

  async function loadMission() {
    const response = await fetch(`/api/entreprise/mission-details?id=${encodeURIComponent(state.missionId)}`, {
      headers: { "X-User-Id": state.userId },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Impossible de récupérer la mission.");
    }

    state.mission = payload;
    state.activeAssignation = payload.active_assignation || null;

    if (payload?.id && state.missionId !== payload.id) {
      state.missionId = payload.id;

      try {
        const url = new URL(window.location.href);
        url.searchParams.set("id", payload.id);
        window.history.replaceState({}, "", url);
      } catch (error) {
        console.warn("Impossible de synchroniser l'URL avec l'id mission", error);
      }
    }
  }

  async function loadTechniciens() {
    const response = await fetch("/api/entreprise/techniciens", {
      headers: { "X-User-Id": state.userId },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Impossible de récupérer les techniciens.");
    }

    state.techniciens = Array.isArray(payload.techniciens)
      ? payload.techniciens.filter((tech) => tech.is_active !== false)
      : [];
  }

  function renderMission() {
    if (!state.mission || !dom.details) return;

    const mission = state.mission;
    const ticket = mission.tickets || {};

    dom.details.innerHTML = `
      <h2>Détails du ticket</h2>
      <p><strong>Statut mission :</strong> ${escapeHtml(formatStatus(mission.statut))}</p>
      <p><strong>Catégorie :</strong> ${escapeHtml(ticket.categorie || "Non précisée")}</p>
      <p><strong>Pièce :</strong> ${escapeHtml(ticket.piece || "Non précisée")}</p>
      <p><strong>Priorité :</strong> ${escapeHtml(ticket.priorite || "Non communiquée")}</p>
      <p><strong>Date d'acceptation :</strong> ${escapeHtml(formatDateTime(mission.date_acceptation))}</p>
      <p><strong>Date d'intervention :</strong> ${escapeHtml(formatDateTime(mission.date_intervention || ticket.dispo1))}</p>
      <p><strong>Description :</strong></p>
      <p>${escapeHtml(ticket.description || "Aucune description")}</p>
    `;
  }

  function renderLocataire() {
    if (!dom.locataireSection || !dom.locataireInfo || !state.mission) return;

    const locataire = state.mission.locataire_details;

    if (!locataire) {
      dom.locataireSection.style.display = "none";
      return;
    }

    dom.locataireInfo.innerHTML = `
      <p><strong>Nom :</strong> ${escapeHtml(`${locataire.prenom || ""} ${locataire.nom || ""}`.trim() || "Non communiqué")}</p>
      <p><strong>Email :</strong> ${escapeHtml(locataire.email || "Non communiqué")}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(locataire.phone || "Non communiqué")}</p>
      <p><strong>Adresse :</strong> ${escapeHtml(buildAdresse(locataire))}</p>
      <p><strong>Digicode :</strong> ${escapeHtml(locataire.building_code || "Non communiqué")}</p>
      <p><strong>Appartement :</strong> ${escapeHtml(locataire.apartment || "Non communiqué")}</p>
    `;

    dom.locataireSection.style.display = "block";
  }

  function renderAssignment() {
    if (!dom.assignmentSection || !dom.assignmentContent) return;

    dom.assignmentSection.classList.remove("hidden");

    if (!state.techniciens.length) {
      dom.assignmentContent.innerHTML = "<p>Ajoutez vos techniciens pour les assigner à cette mission.</p>";
      return;
    }

    const options = state.techniciens
      .map((tech) => {
        const selected = state.activeAssignation?.entreprise_technicien_id === tech.id ? "selected" : "";
        const label = tech.nom || tech.display_name || "Technicien";
        return `<option value="${tech.id}" ${selected}>${escapeHtml(label)}</option>`;
      })
      .join("");

    const assignedLabel = state.activeAssignation
      ? state.activeAssignation.technicien?.display_name || "Technicien"
      : "Non assignée";

    dom.assignmentContent.innerHTML = `
      <div class="assignment-row">
        <label for="technicien-select">Technicien</label>
        <select id="technicien-select">
          <option value="">— Sélectionner —</option>
          ${options}
        </select>
      </div>
      <div class="assignment-row">
        <p><strong>Assignation actuelle :</strong> ${escapeHtml(assignedLabel)}</p>
      </div>
      <div class="assignment-actions">
        <button id="assign-btn">Assigner</button>
        <button id="unassign-btn" ${state.activeAssignation ? "" : "disabled"}>Retirer l'assignation</button>
      </div>
    `;

    document.getElementById("assign-btn").addEventListener("click", handleAssignClick);
    document.getElementById("unassign-btn").addEventListener("click", handleUnassignClick);
  }

  function renderActions() {
    if (!dom.actionButtons) return;

    dom.actionButtons.innerHTML = `
      <button id="download-order-btn">Télécharger l'ordre de mission (PDF)</button>
    `;

    document.getElementById("download-order-btn").addEventListener("click", downloadMissionOrder);
  }

  async function handleAssignClick() {
    const select = document.getElementById("technicien-select");
    if (!select) return;

    const value = select.value;
    if (!value) {
      alert("Merci de sélectionner un technicien.");
      return;
    }

    setAssignmentLoading(true);

    try {
      const response = await fetch("/api/entreprise/missions/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": state.userId,
        },
        body: JSON.stringify({
          mission_id: state.missionId,
          entreprise_technicien_id: value,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Assignation impossible.");
      }

      state.activeAssignation = payload.assignation;
      await loadMission();
      renderMission();
      renderAssignment();
    } catch (error) {
      alert(error.message);
    } finally {
      setAssignmentLoading(false);
    }
  }

  async function handleUnassignClick() {
    setAssignmentLoading(true);

    try {
      const response = await fetch("/api/entreprise/missions/assign", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": state.userId,
        },
        body: JSON.stringify({ mission_id: state.missionId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Retrait impossible.");
      }

      state.activeAssignation = null;
      await loadMission();
      renderMission();
      renderAssignment();
    } catch (error) {
      alert(error.message);
    } finally {
      setAssignmentLoading(false);
    }
  }

  async function downloadMissionOrder() {
    setActionLoading(true);

    try {
      const response = await fetch(`/api/entreprise/missions/order?id=${encodeURIComponent(state.missionId)}`, {
        headers: { "X-User-Id": state.userId },
      });

      if (!response.ok) {
        let message = "Téléchargement de l'ordre impossible.";
        try {
          const payload = await response.json();
          if (payload?.error) message = payload.error;
        } catch (parseError) {
          console.warn("Réponse non JSON lors du téléchargement", parseError);
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `ordre-mission-${state.missionId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  }

  function setAssignmentLoading(isLoading) {
    const assignBtn = document.getElementById("assign-btn");
    const unassignBtn = document.getElementById("unassign-btn");

    if (assignBtn) {
      assignBtn.disabled = isLoading;
      assignBtn.textContent = isLoading ? "Traitement…" : "Assigner";
    }

    if (unassignBtn) {
      unassignBtn.disabled = isLoading || !state.activeAssignation;
      unassignBtn.textContent = isLoading ? "Traitement…" : "Retirer l'assignation";
    }
  }

  function setActionLoading(isLoading) {
    const button = document.getElementById("download-order-btn");
    if (!button) return;

    button.disabled = isLoading;
    button.textContent = isLoading ? "Préparation du PDF…" : "Télécharger l'ordre de mission (PDF)";
  }

  function buildAdresse(locataire) {
    const segments = [locataire.address, locataire.zip_code, locataire.city].filter(Boolean);
    return segments.length ? segments.join(" ") : "Non communiquée";
  }

  function showError(message) {
    dom.loading.style.display = "none";
    dom.error.textContent = message;
    dom.error.style.display = "block";
  }

  function formatStatus(status) {
    if (!status) return "En attente";
    const map = {
      en_attente: "En attente",
      "en attente": "En attente",
      planifiee: "Planifiée",
      planifiée: "Planifiée",
      en_cours: "En cours",
      "en cours": "En cours",
      terminee: "Terminée",
      terminée: "Terminée",
    };
    const normalised = status.toLowerCase().normalize("NFD").replace(/[^a-z_]/g, "");
    return map[normalised] || status;
  }

  function formatDateTime(value) {
    if (!value) return "Non renseignée";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" });
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
});
