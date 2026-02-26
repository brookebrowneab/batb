import { getAuthState } from '../auth.js';

export function renderAdminDashboard() {
  const { user, staffProfile } = getAuthState();
  const displayName = staffProfile?.display_name || user?.email || 'admin';
  return `
    <div class="page">
      <h1>Admin Dashboard</h1>
      <p>Welcome, ${displayName}.</p>
      <h2>Management</h2>
      <ul class="admin-links">
        <li><a href="#/admin/contracts">Contract Management</a></li>
      </ul>
      <div class="placeholder-notice">
        System configuration and overrides will be added in future milestones.
      </div>
    </div>
  `;
}
