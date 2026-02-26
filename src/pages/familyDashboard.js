import { getAuthState } from '../auth.js';

export function renderFamilyDashboard() {
  const { user } = getAuthState();
  return `
    <div class="page">
      <h1>Family Dashboard</h1>
      <p>Welcome, ${user?.email || 'family member'}.</p>
      <div class="placeholder-notice">
        Registration forms and scheduling will be available in future milestones.
      </div>
    </div>
  `;
}
