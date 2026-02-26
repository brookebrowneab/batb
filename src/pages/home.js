import { getAuthState } from '../auth.js';
import { isStaff, isAdmin } from '../domain/roles.js';

export function renderHome() {
  const { session, role } = getAuthState();

  let authSection;
  if (!session) {
    authSection = `
      <p>Please sign in to continue.</p>
      <nav class="home-actions">
        <a href="#/family/login">Family Login</a>
        <a href="#/staff/login">Staff Login</a>
      </nav>
    `;
  } else {
    const links = ['<a href="#/family">Family Dashboard</a>'];
    if (isStaff(role)) links.push('<a href="#/staff">Staff Dashboard</a>');
    if (isAdmin(role)) links.push('<a href="#/admin">Admin Dashboard</a>');
    authSection = `
      <p>You are signed in.</p>
      <nav class="home-actions">${links.join('')}</nav>
    `;
  }

  return `
    <div class="page">
      <h1>BATB Audition System</h1>
      <p>Welcome to the audition registration and scheduling system.</p>
      ${authSection}
    </div>
  `;
}
