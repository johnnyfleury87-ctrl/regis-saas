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

    // filtre depuis les bulles
    const savedFilter = localStorage.getItem("ticketFilter") || "all";
    applyFilter(savedFilter);

    renderTickets(allTickets);

    // supprimer pour éviter l’effet persistant
    localStorage.removeItem("ticketFilter");
}

function renderTickets(list) {
    const container = document.getElementById("tickets-container");
    container.innerHTML = "";

    list.forEach(ticket => {
        const card = document.createElement("div");
        card.className = "ticket-card";

        card.innerHTML = `
            <div class="ticket-header">
                <span>${ticket.categorie} – ${ticket.piece}</span>
                <span class="ticket-status status-${ticket.statut}">
                    ${ticket.statut.replace("_", " ")}
                </span>
            </div>
            <p><strong>Détail :</strong> ${ticket.detail}</p>
            <p><strong>Description :</strong> ${ticket.description || "–"}</p>
            <p><strong>Disponibilité 1 :</strong> ${ticket.dispo1}</p>
        `;

        container.appendChild(card);
    });
}

function applyFilter(status) {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach(btn => btn.classList.remove("active"));

    document.querySelector(`[data-filter="${status}"]`)?.classList.add("active");

    const container = document.getElementById("tickets-container");

    // récupération des tickets déjà chargés
    const cards = container.querySelectorAll(".ticket-card");

    cards.forEach(card => {
        const statusText = card.querySelector(".ticket-status").textContent.trim().toLowerCase();

        if (status === "all" ||
            statusText.includes(status.replace("_", " "))) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
        applyFilter(btn.dataset.filter);
    };
});

loadTickets();
