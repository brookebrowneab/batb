import { getAuthState } from '../auth.js';
import { escapeHtml } from '../ui/escapeHtml.js';

export function renderStaffDashboard() {
  const { user, role, staffProfile } = getAuthState();
  const displayName = staffProfile?.display_name || user?.email || 'staff';
  return `
    <div class="page">
      <h1>Staff Dashboard</h1>
      <p>Welcome, ${escapeHtml(displayName)}. Role: <strong>${escapeHtml(role)}</strong></p>
      <h2>Management</h2>
      <ul class="admin-links">
        <li><a href="#/staff/scheduling">Scheduling Configuration</a></li>
        <li><a href="#/staff/dance-roster">Dance Roster</a></li>
        <li><a href="#/staff/vocal-roster">Vocal Roster</a></li>
      </ul>
    </div>
  `;
}
