import { getAuthState } from '../auth.js';

export function renderStaffDashboard() {
  const { user, role, staffProfile } = getAuthState();
  const displayName = staffProfile?.display_name || user?.email || 'staff';
  return `
    <div class="page">
      <h1>Staff Dashboard</h1>
      <p>Welcome, ${displayName}. Role: <strong>${role}</strong></p>
      <div class="placeholder-notice">
        Rosters, scheduling config, and student profiles will be added in future milestones.
      </div>
    </div>
  `;
}
