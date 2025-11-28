document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.error);
    return;
  }

  // Redirection selon le rôle
  switch (data.role) {
    case "regie":
      window.location.href = "/regie/index.html";
      break;
    case "technicien":
      window.location.href = "/technicien/index.html";
      break;
    case "locataire":
      window.location.href = "/locataire/index.html";
      break;
    case "entreprise":
      window.location.href = "/entreprise/index.html";
      break;
    default:
      window.location.href = "/dashboard.html"; // fallback
  }
});
