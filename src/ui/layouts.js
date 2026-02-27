import { ICONS } from './icons.js';

/**
 * Build the family layout shell.
 * @param {string} userEmail
 * @returns {{ element: HTMLDivElement, content: HTMLElement, updateActiveTab: Function }}
 */
export function buildFamilyLayout(userEmail) {
  const el = document.createElement('div');

  el.innerHTML = `
    <div class="top-bar">
      <a href="#/" class="top-bar__brand">${ICONS.rose} Beauty and the Beast <span>Auditions</span></a>
      <div class="top-bar__actions">
        <span class="top-bar__user">${userEmail || ''}</span>
        <button class="top-bar__logout" id="layout-logout-btn">Sign Out</button>
      </div>
    </div>
    <div class="layout-family">
      <main id="route-content"></main>
    </div>
    <nav class="bottom-tabs" aria-label="Family navigation">
      <div class="bottom-tabs__list">
        <a href="#/family" class="bottom-tabs__item" data-tab="/family">
          <span class="icon">${ICONS.home}</span>
          Home
        </a>
        <a href="#/family/register" class="bottom-tabs__item" data-tab="/family/register">
          <span class="icon">${ICONS.clipboard}</span>
          Register
        </a>
        <a href="#/family/schedule" class="bottom-tabs__item" data-tab="/family/schedule">
          <span class="icon">${ICONS.calendar}</span>
          Schedule
        </a>
        <a href="#/family/dance" class="bottom-tabs__item" data-tab="/family/dance">
          <span class="icon">${ICONS.ticket}</span>
          Dance
        </a>
        <a href="#/family/vocal" class="bottom-tabs__item" data-tab="/family/vocal">
          <span class="icon">${ICONS.vocal || '🎤'}</span>
          Vocal
        </a>
      </div>
    </nav>
  `;

  const content = el.querySelector('#route-content');

  function updateActiveTab(path) {
    el.querySelectorAll('.bottom-tabs__item').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === path);
    });
  }

  return { element: el, content, updateActiveTab };
}

/**
 * Build the staff layout shell with sidebar.
 * @param {string} displayName
 * @param {string} role
 * @param {boolean} isAdminUser
 * @returns {{ element: HTMLDivElement, content: HTMLElement, updateActiveLink: Function }}
 */
export function buildStaffLayout(displayName, role, isAdminUser) {
  const el = document.createElement('div');

  const adminLinks = isAdminUser ? `
    <div class="sidebar__section">
      <div class="sidebar__label">Admin</div>
    </div>
    <a href="#/admin" class="sidebar__link" data-nav="/admin">
      <span class="icon">${ICONS.chart}</span> Admin Dashboard
    </a>
    <a href="#/admin/contracts" class="sidebar__link" data-nav="/admin/contracts">
      <span class="icon">${ICONS.clipboard}</span> Contracts
    </a>
    <a href="#/admin/registrations" class="sidebar__link" data-nav="/admin/registrations">
      <span class="icon">${ICONS.people}</span> Registrations
    </a>
  ` : '';

  el.innerHTML = `
    <div class="top-bar">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <button class="hamburger-btn" id="sidebar-toggle" aria-label="Toggle menu">${ICONS.menu}</button>
        <a href="#/staff" class="top-bar__brand">${ICONS.theater} BATB Staff</a>
      </div>
      <div class="top-bar__actions">
        <span class="top-bar__user">${displayName || ''} <span class="badge active" style="font-size:0.7rem">${role || ''}</span></span>
        <button class="top-bar__logout" id="layout-logout-btn">Sign Out</button>
      </div>
    </div>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <aside class="sidebar" id="staff-sidebar">
      <div class="sidebar__section">
        <div class="sidebar__label">Management</div>
      </div>
      <a href="#/staff" class="sidebar__link" data-nav="/staff">
        <span class="icon">${ICONS.home}</span> Dashboard
      </a>
      <a href="#/staff/scheduling" class="sidebar__link" data-nav="/staff/scheduling">
        <span class="icon">${ICONS.calendar}</span> Scheduling
      </a>
      <a href="#/staff/dance-roster" class="sidebar__link" data-nav="/staff/dance-roster">
        <span class="icon">${ICONS.dance}</span> Dance Roster
      </a>
      <a href="#/staff/vocal-roster" class="sidebar__link" data-nav="/staff/vocal-roster">
        <span class="icon">${ICONS.vocal}</span> Vocal Roster
      </a>
      <a href="#/staff/callbacks" class="sidebar__link" data-nav="/staff/callbacks">
        <span class="icon">${ICONS.callback}</span> Callbacks
      </a>
      <a href="#/staff/roles" class="sidebar__link" data-nav="/staff/roles">
        <span class="icon">🎭</span> Audition Roles
      </a>
      <a href="#/staff/vocal-assignments" class="sidebar__link" data-nav="/staff/vocal-assignments">
        <span class="icon">📋</span> Vocal Assignments
      </a>
      ${adminLinks}
    </aside>
    <div class="layout-staff">
      <main id="route-content"></main>
    </div>
  `;

  const content = el.querySelector('#route-content');
  const sidebar = el.querySelector('#staff-sidebar');
  const overlay = el.querySelector('#sidebar-overlay');
  const toggle = el.querySelector('#sidebar-toggle');

  // Mobile sidebar toggle
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar--open');
      overlay.classList.toggle('sidebar-overlay--visible');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('sidebar-overlay--visible');
    });
  }

  // Close sidebar on link click (mobile)
  el.querySelectorAll('.sidebar__link').forEach((link) => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('sidebar-overlay--visible');
    });
  });

  function updateActiveLink(path) {
    el.querySelectorAll('.sidebar__link').forEach((link) => {
      link.classList.toggle('active', link.dataset.nav === path);
    });
  }

  return { element: el, content, updateActiveLink };
}

/**
 * Build minimal public layout (login, home).
 * @returns {{ element: HTMLDivElement, content: HTMLElement }}
 */
export function buildPublicLayout() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="layout-public">
      <main id="route-content"></main>
    </div>
  `;
  return { element: el, content: el.querySelector('#route-content') };
}
