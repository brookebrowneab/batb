import { getAuthState } from '../auth.js';
import { isStaff, isAdmin } from '../domain/roles.js';

export function renderHome() {
  const { session, role } = getAuthState();

  let authSection;
  if (!session) {
    authSection = `
      <div class="hero-actions">
        <a href="#/family/login" class="btn-accent">Family Login</a>
        <a href="#/staff/login" class="btn-primary">Staff Login</a>
      </div>
    `;
  } else {
    const links = ['<a href="#/family" class="btn-accent">Family Dashboard</a>'];
    if (isStaff(role)) links.push('<a href="#/staff" class="btn-primary">Staff Dashboard</a>');
    if (isAdmin(role)) links.push('<a href="#/admin" class="btn-ghost">Admin Dashboard</a>');
    authSection = `
      <p style="margin-bottom:var(--space-md)">You are signed in.</p>
      <nav class="home-actions">${links.join('')}</nav>
    `;
  }

  if (!session) {
    return `
      <div class="page">
        <div class="hero-section">
          <h1>Beauty and the Beast</h1>
          <p>Register your student, sign up for audition slots, and track your schedule — all in one place.</p>
          <div class="tagline">Be our guest! 🌹</div>
          ${authSection}
        </div>
      </div>
    `;
  }

  return `
    <div class="page">
      <h1>Beauty and the Beast Auditions 🌹</h1>
      <p>Welcome back! Manage your audition registration and schedule below.</p>
      ${authSection}
    </div>
  `;
}
