console.log("Régie: chargement des compteurs de tickets…");

async function loadTicketCounters() {
    const regieId = localStorage.getItem("regieId");
    if (!regieId) {
        console.warn("Pas de regieId dans localStorage.");
        return;
    }

    try {
        const res = await fetch(`/api/regie/tickets?regieId=${regieId}`);
        const out = await res.json();

        if (!res.ok) {
            console.error("Erreur API tickets:", out.error);
            return;
        }

        const tickets = out.tickets || [];

        // Compteurs
        const nbNew = tickets.filter(t => t.statut === "en_attente").length;
        const nbProgress = tickets.filter(t => t.statut === "en_cours").length;

        // Update UI
        document.getElementById("badge-new").textContent = nbNew;
        document.getElementById("badge-progress").textContent = nbProgress;

    } catch (err) {
        console.error("Erreur JS loadTicketCounters:", err);
    }
}

loadTicketCounters();
