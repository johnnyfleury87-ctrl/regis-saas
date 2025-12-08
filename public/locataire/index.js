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

        const nomElt = document.getElementById("locataire-nom");
        if (nomElt) {
            nomElt.textContent = `${loc.prenom || ""} ${loc.nom || ""}`.trim() || "Locataire";
        }
        document.getElementById("lg-address").textContent = loc.address || "-";
        document.getElementById("lg-zipcity").textContent = `${loc.zip_code || ""} ${loc.city || ""}`;
        document.getElementById("lg-rent").textContent = loc.loyer ? `${loc.loyer} CHF / mois` : "-";

    } catch (err) {
        console.error("Erreur dans loadLocataire:", err);
    }
}

async function loadTickets() {
    try {
        const res = await fetch(`/api/locataires/tickets?userId=${encodeURIComponent(userId)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error("Erreur tickets locataire:", data.error || res.statusText);
            renderTickets([]);
            return;
        }

        const tickets = Array.isArray(data.tickets) ? data.tickets : [];
        updateTicketStats(tickets);
        renderTickets(tickets);
    } catch (error) {
        console.error("Impossible de charger les tickets locataire:", error);
        renderTickets([]);
    }
}

function updateTicketStats(tickets) {
    const resolusElt = document.getElementById("ticket-resolus-count");
    const encoursElt = document.getElementById("ticket-encours-count");

    if (!resolusElt || !encoursElt) return;

    const normalise = (value) => (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const resolvedStatuses = new Set(["termine", "terminee", "resolu", "resolue"]);
    const activeStatuses = new Set(["en_attente", "en attente", "publie", "publiee", "en_cours", "encours", "acceptee"]);

    const resolus = tickets.filter((ticket) => {
        const ticketStatus = normalise(ticket.statut);
        const missionStatus = normalise(ticket.mission?.statut);
        return resolvedStatuses.has(ticketStatus) || resolvedStatuses.has(missionStatus);
    }).length;

    const actifs = tickets.filter((ticket) => {
        const ticketStatus = normalise(ticket.statut);
        const missionStatus = normalise(ticket.mission?.statut);

        if (resolvedStatuses.has(ticketStatus) || resolvedStatuses.has(missionStatus)) {
            return false;
        }

        return activeStatuses.has(ticketStatus) || activeStatuses.has(missionStatus);
    }).length;

    resolusElt.textContent = resolus;
    encoursElt.textContent = actifs;
}

function renderTickets(tickets) {
    const container = document.getElementById("tickets-list");
    if (!container) return;

    container.innerHTML = "";

    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<p class="hint">Vous n\'avez pas encore créé de ticket.</p>';
        return;
    }

    const sorted = [...tickets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    sorted.forEach((ticket) => {
        container.appendChild(buildTicketRow(ticket));
    });
}

function buildTicketRow(ticket) {
    const row = document.createElement("div");
    row.className = "ticket-row";

    const label = `${ticket.categorie || ""}${ticket.piece ? " · " + ticket.piece : ""}` || "Demande";
    const createdAt = formatDate(ticket.created_at);
    const entreprise = ticket.entreprise?.name || null;

    const missionDate = ticket.mission?.date_intervention ? formatDate(ticket.mission.date_intervention) : null;

    const metaParts = [
        createdAt ? `Créé le ${createdAt}` : null,
        missionDate ? `Visite prévue: ${missionDate}` : null,
        entreprise ? `Intervenant: ${entreprise}` : null,
    ];
    const meta = metaParts.filter(Boolean).join(" · ") || "Suivi en cours";

    row.innerHTML = `
        <div class="ticket-main">
            <span class="ticket-label">${escapeHtml(label)}</span>
            <span class="ticket-meta">${escapeHtml(meta)}</span>
        </div>
        <span class="ticket-status ${statusClass(ticket.statut, ticket.mission?.statut)}">${escapeHtml(formatStatus(ticket.statut, ticket.mission?.statut))}</span>
    `;

    return row;
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatStatus(ticketStatus, missionStatus) {
    const normalise = (value) => (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const status = normalise(ticketStatus);
    const mission = normalise(missionStatus);

    if (["termine", "terminee", "resolu", "resolue"].includes(status) || ["termine", "terminee"].includes(mission)) {
        return "Terminé";
    }

    if (["publie"].includes(status)) {
        return "En publication";
    }

    if (["en_cours", "encours"].includes(status) || ["acceptee", "en_cours", "encours"].includes(mission)) {
        return "En cours";
    }

    if (["en_attente", "nouveau"].includes(status)) {
        return "En attente";
    }

    return ticketStatus || "-";
}

function statusClass(status, missionStatus) {
    const normalise = (value) => (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const ticket = normalise(status);
    const mission = normalise(missionStatus);

    if (["termine", "terminee", "resolu", "resolue"].includes(ticket) || ["termine", "terminee"].includes(mission)) {
        return "ticket-status--done";
    }

    if (["annule", "annulee", "refuse", "refusee"].includes(ticket)) {
        return "ticket-status--cancel";
    }

    if (["publie", "publiee", "en_cours", "encours", "acceptee"].includes(ticket) || ["acceptee", "en_cours", "encours"].includes(mission)) {
        return "ticket-status--open";
    }

    return "ticket-status--pending";
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

loadLocataire();
loadTickets();
window.__locataireLoadTickets = loadTickets;

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login.html";
});