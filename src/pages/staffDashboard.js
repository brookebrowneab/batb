import { getAuthState } from '../auth.js';
import { escapeHtml } from '../ui/escapeHtml.js';

export function renderStaffDashboard() {
  const { user, role, staffProfile } = getAuthState();
  const displayName = staffProfile?.display_name || user?.email || 'staff';

  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <div style="margin-bottom:var(--space-xl)">
      <h1>Welcome back, ${escapeHtml(displayName)} 🎭</h1>
      <span class="badge active" style="font-size:var(--text-xs)">${escapeHtml(role)}</span>
    </div>

    <div class="quick-actions" style="margin-bottom:var(--space-xl)">
      <a href="#/staff/scheduling" class="quick-action">
        <span class="quick-action__icon">📅</span>
        <span class="quick-action__text">Scheduling</span>
      </a>
      <a href="#/staff/dance-roster" class="quick-action">
        <span class="quick-action__icon">🎵</span>
        <span class="quick-action__text">Dance Roster</span>
      </a>
      <a href="#/staff/vocal-roster" class="quick-action">
        <span class="quick-action__icon">🎤</span>
        <span class="quick-action__text">Vocal Roster</span>
      </a>
      <a href="#/staff/callbacks" class="quick-action">
        <span class="quick-action__icon">⭐</span>
        <span class="quick-action__text">Callbacks</span>
      </a>
      <a href="#/staff/roles" class="quick-action">
        <span class="quick-action__icon">🎭</span>
        <span class="quick-action__text">Audition Roles</span>
      </a>
      <a href="#/staff/vocal-assignments" class="quick-action">
        <span class="quick-action__icon">📋</span>
        <span class="quick-action__text">Vocal Assignments</span>
      </a>
    </div>

    <h2>Quick Links</h2>
    <ul class="admin-links">
      <li><a href="#/staff/scheduling">Scheduling Configuration</a></li>
      <li><a href="#/staff/dance-roster">Dance Roster</a></li>
      <li><a href="#/staff/vocal-roster">Vocal Roster</a></li>
      <li><a href="#/staff/callbacks">Callback Management</a></li>
      <li><a href="#/staff/roles">Audition Roles</a></li>
      <li><a href="#/staff/vocal-assignments">Vocal Assignments</a></li>
    </ul>
  `;

  return container;
}
