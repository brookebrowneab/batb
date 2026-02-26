import { getAuthState } from '../auth.js';

export function renderStaffDashboard() {
  const { user, role, staffProfile } = getAuthState();
  const displayName = staffProfile?.display_name || user?.email || 'staff';
  return `
    <div class="page">
      <h1>Staff Dashboard</h1>
      <p>Welcome, ${displayName}. Role: <strong>${role}</strong></p>
      <h2>Management</h2>
      <ul class="admin-links">
        <li><a href="#/staff/scheduling">Scheduling Configuration</a></li>
      </ul>
      <div class="placeholder-notice">
        Rosters and student profiles will be added in future milestones.
      </div>
    </div>
  `;
}
