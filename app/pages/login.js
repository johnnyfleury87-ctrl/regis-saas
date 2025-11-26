export default function Login() {
  return `
    <h1>Connexion</h1>
    <form id="loginForm">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Mot de passe" required />
      <button type="submit">Connexion</button>
    </form>
    <script src="/public/login.js"></script>
  `;
}
