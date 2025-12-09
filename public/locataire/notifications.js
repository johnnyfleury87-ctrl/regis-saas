const notificationState = {
  userId: null,
  notifications: [],
};

const notificationDom = {
  container: null,
};

window.addEventListener("DOMContentLoaded", () => {
  notificationDom.container = document.getElementById("notifications-panel");
  notificationState.userId = localStorage.getItem("userId");

  if (!notificationDom.container || !notificationState.userId) {
    return;
  }

  loadNotifications();
});

async function loadNotifications() {
  try {
    notificationDom.container.innerHTML = "<p class='hint'>Chargement des notifications…</p>";
    const response = await fetch(`/api/locataires/notifications`, {
      headers: {
        "X-User-Id": notificationState.userId,
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Chargement impossible");
    }

    notificationState.notifications = Array.isArray(payload.notifications)
      ? payload.notifications
+      : [];

    renderNotifications();
  } catch (error) {
    console.error("Impossible de récupérer les notifications locataire:", error);
    notificationDom.container.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

function renderNotifications() {
  if (!notificationDom.container) return;

  if (!notificationState.notifications.length) {
    notificationDom.container.innerHTML = "<p class='hint'>Aucune notification pour le moment.</p>";
    return;
  }

  const list = document.createElement("div");
  list.className = "notifications-list";

  notificationState.notifications.forEach((notif) => {
    list.appendChild(buildNotificationCard(notif));
  });

  notificationDom.container.innerHTML = "";
  notificationDom.container.appendChild(list);
}

function buildNotificationCard(notif) {
  const card = document.createElement("article");
  card.className = "notification-card";

  const createdAt = formatDate(notif.sent_at || notif.created_at);
  const statusLabel = formatStatus(notif.delivery_status);

  card.innerHTML = `
    <header>
      <strong>${escapeHtml(notif.title || "Notification")}</strong>
      <small>${escapeHtml(createdAt)}</small>
    </header>
    <p>${escapeHtml(notif.message)}</p>
    <footer>
      <span class="badge">${escapeHtml(statusLabel)}</span>
    </footer>
  `;

  return card;
}

function formatStatus(status) {
  const map = {
    pending: "En attente",
    sent: "Envoyée",
    delivered: "Reçue",
    read: "Lue",
  };

  return map[status] || "Enregistrée";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
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

window.__locataireLoadNotifications = loadNotifications;
