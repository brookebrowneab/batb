import { getAuthState } from '../auth.js';

export function renderAdminDashboard() {
  const { user, staffProfile } = getAuthState();
  const displayName = staffProfile?.display_name || user?.email || 'admin';
  return `
    <div class="page">
      <h1>Admin Dashboard</h1>
      <p>Welcome, ${displayName}.</p>
      <div class="placeholder-notice">
        Contract management, system configuration, and overrides will be added in future milestones.
      </div>
    </div>
  `;
}
