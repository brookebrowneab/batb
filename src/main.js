import { addRoute, setNotFound, setGuard, startRouter, navigate, currentPath } from './router.js';
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
import { renderAdminRegistrations } from './pages/adminRegistrations.js';
import { renderFamilyContract } from './pages/familyContract.js';
import { renderFamilyRegistration } from './pages/familyRegistration.js';
import { renderStaffScheduling } from './pages/staffScheduling.js';
import { renderFamilySchedule } from './pages/familySchedule.js';
import { renderFamilyDanceSignup } from './pages/familyDanceSignup.js';
import { renderStaffDanceRoster } from './pages/staffDanceRoster.js';
import { renderFamilyVocalBooking } from './pages/familyVocalBooking.js';
import { renderStaffVocalRoster } from './pages/staffVocalRoster.js';
import { renderStaffCallbacks } from './pages/staffCallbacks.js';
import { renderStaffStudentProfile } from './pages/staffStudentProfile.js';
import { renderStaffRoleConfig } from './pages/staffRoleConfig.js';
import { renderStaffVocalAssignments } from './pages/staffVocalAssignments.js';
import { buildFamilyLayout, buildStaffLayout, buildPublicLayout } from './ui/layouts.js';

let currentLayoutType = null;
let layoutRef = null;

function getLayoutType(path) {
  const { session, role } = getAuthState();
  if (!session) return 'public';
  if (path.startsWith('/staff') || path.startsWith('/admin')) {
    return isStaff(role) ? 'staff' : 'public';
  }
  if (path.startsWith('/family')) return 'family';
  return 'public';
}

function buildLayout(type) {
  const { session, role, staffProfile } = getAuthState();
  switch (type) {
    case 'family':
      return buildFamilyLayout(session?.user?.email || '');
    case 'staff': {
      const displayName = staffProfile?.display_name || session?.user?.email || '';
      return buildStaffLayout(displayName, role, isAdmin(role));
    }
    default:
      return buildPublicLayout();
  }
}

function bindLogout() {
  const btn = document.getElementById('layout-logout-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        await signOut();
      } finally {
        navigate('/');
      }
    });
  }
}

function updateLayout() {
  const path = currentPath();
  const type = getLayoutType(path);
  const app = document.getElementById('app');
  if (!app) return;

  if (type !== currentLayoutType) {
    currentLayoutType = type;
    layoutRef = buildLayout(type);
    app.innerHTML = '';
    app.appendChild(layoutRef.element);
    bindLogout();
  }

  // Update active indicators
  if (type === 'family' && layoutRef.updateActiveTab) {
    layoutRef.updateActiveTab(path);
  } else if (type === 'staff' && layoutRef.updateActiveLink) {
    layoutRef.updateActiveLink(path);
  }
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

async function init() {
  const app = document.getElementById('app');
  if (!app) return;

  // Bootstrap with a minimal shell so router has a target
  app.innerHTML = `<main id="route-content"></main>`;

  // Register routes
  addRoute('/', renderHome);
  addRoute('/family/login', renderFamilyLogin);
  addRoute('/staff/login', renderStaffLogin);
  addRoute('/family', renderFamilyDashboard);
  addRoute('/staff', renderStaffDashboard);
  addRoute('/admin', renderAdminDashboard);
  addRoute('/admin/contracts', renderAdminContracts);
  addRoute('/admin/registrations', renderAdminRegistrations);
  addRoute('/family/contract', renderFamilyContract);
  addRoute('/family/register', renderFamilyRegistration);
  addRoute('/family/schedule', renderFamilySchedule);
  addRoute('/family/dance', renderFamilyDanceSignup);
  addRoute('/family/vocal', renderFamilyVocalBooking);
  addRoute('/staff/scheduling', renderStaffScheduling);
  addRoute('/staff/dance-roster', renderStaffDanceRoster);
  addRoute('/staff/vocal-roster', renderStaffVocalRoster);
  addRoute('/staff/callbacks', renderStaffCallbacks);
  addRoute('/staff/student-profile', renderStaffStudentProfile);
  addRoute('/staff/roles', renderStaffRoleConfig);
  addRoute('/staff/vocal-assignments', renderStaffVocalAssignments);
  setNotFound(renderNotFound);

  // Initialize auth BEFORE starting router so guard has session/role
  await initAuth();

  // Set auth guard
  setGuard((path) => {
    const { session, role } = getAuthState();
    return canAccessRoute(path, session, role);
  });

  // Build layout before router renders first page
  const path = (window.location.hash || '#/').slice(1).split('?')[0] || '/';
  const type = getLayoutType(path);
  currentLayoutType = type;
  layoutRef = buildLayout(type);
  app.innerHTML = '';
  app.appendChild(layoutRef.element);
  bindLogout();

  const { rerender } = startRouter('#route-content');

  // Listen for hash changes to update layout
  window.addEventListener('hashchange', () => {
    updateLayout();
  });

  // Re-render layout and route on auth state change (skip if nothing changed)
  let lastUserId = getAuthState().user?.id ?? null;
  let lastRole = getAuthState().role;
  subscribe(() => {
    const { user, role } = getAuthState();
    const userId = user?.id ?? null;
    if (userId === lastUserId && role === lastRole) return;
    lastUserId = userId;
    lastRole = role;
    updateLayout();
    rerender();
  });

  // Default to home if no hash
  if (!window.location.hash) {
    navigate('/');
  }
}

document.addEventListener('DOMContentLoaded', init);
