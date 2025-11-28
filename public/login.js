console.log("Email envoyé :", email);
console.log("Password envoyé :", password);

const res = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
