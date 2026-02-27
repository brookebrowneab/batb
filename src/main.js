import { addRoute, setNotFound, setGuard, startRouter, navigate } from './router.js';
import { initAuth, getAuthState, subscribe } from './auth.js';
import { canAccessRoute, isStaff, isAdmin } from './domain/roles.js';
import { signOut } from './adapters/auth.js';
import { renderHome } from './pages/home.js';
import { renderFamilyLogin } from './pages/familyLogin.js';
import { renderStaffLogin } from './pages/staffLogin.js';
import { renderFamilyDashboard } from './pages/familyDashboard.js';
import { renderStaffDashboard } from './pages/staffDashboard.js';
import { renderAdminDashboard } from './pages/adminDashboard.js';
import { renderAdminContracts } from './pages/adminContracts.js';
import { renderFamilyContract } from './pages/familyContract.js';
import { renderFamilyRegistration } from './pages/familyRegistration.js';
import { renderStaffScheduling } from './pages/staffScheduling.js';
import { renderFamilySchedule } from './pages/familySchedule.js';
import { renderFamilyDanceSignup } from './pages/familyDanceSignup.js';
import { renderStaffDanceRoster } from './pages/staffDanceRoster.js';

function renderNav() {
  const { session, role } = getAuthState();
  const links = ['<a href="#/" data-route="/">Home</a>'];

  if (!session) {
    links.push('<a href="#/family/login" data-route="/family/login">Family Login</a>');
    links.push('<a href="#/staff/login" data-route="/staff/login">Staff Login</a>');
  } else {
    links.push('<a href="#/family" data-route="/family">Family</a>');
    if (isStaff(role)) {
      links.push('<a href="#/staff" data-route="/staff">Staff</a>');
    }
    if (isAdmin(role)) {
      links.push('<a href="#/admin" data-route="/admin">Admin</a>');
    }
    links.push('<a href="#" id="logout-link">Sign Out</a>');
  }

  return `<nav>${links.join('')}</nav>`;
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

function updateNav() {
  const navEl = document.getElementById('main-nav');
  if (navEl) navEl.innerHTML = renderNav();

  // Bind logout
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut();
      navigate('/');
    });
  }
}

async function init() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div id="main-nav">${renderNav()}</div>
    <main id="route-content"></main>
  `;

  // Register routes
  addRoute('/', renderHome);
  addRoute('/family/login', renderFamilyLogin);
  addRoute('/staff/login', renderStaffLogin);
  addRoute('/family', renderFamilyDashboard);
  addRoute('/staff', renderStaffDashboard);
  addRoute('/admin', renderAdminDashboard);
  addRoute('/admin/contracts', renderAdminContracts);
  addRoute('/family/contract', renderFamilyContract);
  addRoute('/family/register', renderFamilyRegistration);
  addRoute('/family/schedule', renderFamilySchedule);
  addRoute('/family/dance', renderFamilyDanceSignup);
  addRoute('/staff/scheduling', renderStaffScheduling);
  addRoute('/staff/dance-roster', renderStaffDanceRoster);
  setNotFound(renderNotFound);

  // Set auth guard
  setGuard((path) => {
    const { session, role } = getAuthState();
    return canAccessRoute(path, session, role);
  });

  const { rerender } = startRouter('#route-content');

  // Re-render nav and route on auth state change
  subscribe(() => {
    updateNav();
    rerender();
  });

  // Initialize auth (reads session, fetches role)
  await initAuth();

  // Default to home if no hash
  if (!window.location.hash) {
    navigate('/');
  }
}

document.addEventListener('DOMContentLoaded', init);
