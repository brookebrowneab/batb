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
        <li><a href="#/staff/dance-roster">Dance Roster & Overrides</a></li>
      </ul>
    </div>
  `;
}
