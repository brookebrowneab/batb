import { addRoute, setNotFound, startRouter, navigate } from './router.js';
import { renderHome } from './pages/home.js';
import { renderFamilyLogin } from './pages/familyLogin.js';
import { renderStaffLogin } from './pages/staffLogin.js';

function renderNav() {
  return `
    <nav>
      <a href="#/" data-route="/">Home</a>
      <a href="#/family/login" data-route="/family/login">Family Login</a>
      <a href="#/staff/login" data-route="/staff/login">Staff Login</a>
    </nav>
  `;
}

function renderNotFound() {
  return `
    <div class="page">
      <h1>404 — Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="#/">Return to Home</a>
    </div>
  `;
}

function init() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    ${renderNav()}
    <main id="route-content"></main>
  `;

  addRoute('/', renderHome);
  addRoute('/family/login', renderFamilyLogin);
  addRoute('/staff/login', renderStaffLogin);
  setNotFound(renderNotFound);

  startRouter('#route-content');

  // Default to home if no hash
  if (!window.location.hash) {
    navigate('/');
  }
}

document.addEventListener('DOMContentLoaded', init);
