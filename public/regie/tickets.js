console.log("Chargement des tickets régie…");

async function loadTickets() {
    const regieId = localStorage.getItem("regieId");
    const container = document.getElementById("tickets-container");

    if (!regieId) {
        container.innerHTML = "<p>Erreur : aucune régie trouvée.</p>";
        return;
    }

    const res = await fetch(`/api/regie/tickets?regieId=${regieId}`);
    const out = await res.json();

    if (!res.ok) {
        container.innerHTML = "<p>Impossible de charger les tickets.</p>";
        return;
    }

    const allTickets = out.tickets || [];

    updateFilterCounters(allTickets);

    renderTickets(allTickets);

    const savedFilter = localStorage.getItem("ticketFilter") || "all";
    applyFilter(savedFilter);
    localStorage.removeItem("ticketFilter");
}

function updateFilterCounters(list) {
    const countAll = list.length;
    const countNew = list.filter(t => t.statut === "en_attente").length;
    const countProgress = list.filter(t => t.statut === "en_cours").length;
    const countDone = list.filter(t => t.statut === "termine").length;

    document.querySelector('[data-filter="all"]').innerHTML = `Tous (${countAll})`;
    document.querySelector('[data-filter="en_attente"]').innerHTML = `Nouveaux (${countNew})`;
    document.querySelector('[data-filter="en_cours"]').innerHTML = `En cours (${countProgress})`;
    document.querySelector('[data-filter="termine"]').innerHTML = `Terminés (${countDone})`;
}

function renderTickets(tickets) {
    const container = document.getElementById("tickets-container");
    container.innerHTML = "";

    tickets.forEach(ticket => {
        const card = document.createElement("div");
        card.className = "ticket-card";

        card.innerHTML = `
            <div class="ticket-header">
                <span>${ticket.categorie} – ${ticket.piece}</span>

                <div>
                    <span class="priority priority-${ticket.priorite || "P4"}">
                        ${ticket.priorite || "P4"}
                    </span>
                    <span class="ticket-status status-${ticket.statut}">
                        ${ticket.statut.replace("_", " ")}
                    </span>
                </div>
            </div>

            <div class="ticket-locataire">
                <strong>Locataire :</strong> ${ticket.locataire_prenom || ""} ${ticket.locataire_nom || ""}<br>
                <strong>Adresse :</strong> ${ticket.adresse || "—"}<br>
                <strong>Email :</strong> ${ticket.locataire_email || "—"}
            </div>

            <hr>

            <p><strong>Détail :</strong> ${ticket.detail}</p>
            <p><strong>Description :</strong> ${ticket.description || "–"}</p>
            <p><strong>Disponibilité 1 :</strong> ${ticket.dispo1}</p>
        `;

        container.appendChild(card);
    });
}

function applyFilter(type) {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    document.querySelector(`[data-filter="${type}"]`)?.classList.add("active");

    document.querySelectorAll(".ticket-card").forEach(card => {
        const status = card.querySelector(".ticket-status").textContent.trim().toLowerCase();

        if (type === "all" || status.includes(type.replace("_", " "))) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => applyFilter(btn.dataset.filter);
});

loadTickets();
