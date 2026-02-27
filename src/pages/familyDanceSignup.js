import { getAuthState } from '../auth.js';
import { fetchStudentsByFamily } from '../adapters/students.js';
import { fetchAllConfigs } from '../adapters/scheduling.js';
import { formatTime, formatDate } from '../domain/scheduling.js';
import { escapeHtml } from '../ui/escapeHtml.js';

function getDanceWindows(configs) {
  return (configs || []).filter((config) => config.dance_start_time && config.dance_end_time);
}

export function renderFamilyDanceSignup() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Dance Audition Schedule 🎵</h1>
    <p style="margin-bottom:var(--space-md)">
      Dance is required for all students. Families do not sign up for dance slots.
      The production team assigns the dance day and time.
    </p>
    <div id="dance-content"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    const { user } = getAuthState();
    if (!user) return;

    const contentEl = document.getElementById('dance-content');
    if (!contentEl) return;

    const [studentsResult, configsResult] = await Promise.all([
      fetchStudentsByFamily(user.id),
      fetchAllConfigs(),
    ]);

    const students = studentsResult.data || [];
    const danceWindows = getDanceWindows(configsResult.data || []);

    if (students.length === 0) {
      contentEl.innerHTML = '<div class="placeholder-notice">No students registered yet. <a href="#/family/register">Start registration</a>.</div>';
      return;
    }

    if (danceWindows.length === 0) {
      contentEl.innerHTML = `
        <div class="placeholder-notice">
          Dance day/time has not been posted yet. Check back soon.
        </div>
      `;
      return;
    }

    const cards = students.map((student) => `
      <div class="card" style="margin-bottom:var(--space-md)">
        <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
          <div class="avatar">${(student.first_name || '?')[0]}${(student.last_name || '?')[0]}</div>
          <h3 style="margin:0">${escapeHtml(student.first_name || 'Unnamed')} ${escapeHtml(student.last_name || 'Student')}</h3>
        </div>
        <div class="success-box" style="padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)">
          <p style="font-size:var(--text-small);margin:0 0 var(--space-xs)"><strong>Assigned Dance Windows (Required):</strong></p>
          <ul style="margin:0;padding-left:1rem;font-size:var(--text-small)">
            ${danceWindows.map((window) => `
              <li>${formatDate(window.audition_date)} — ${formatTime(window.dance_start_time)} – ${formatTime(window.dance_end_time)}</li>
            `).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    contentEl.innerHTML = cards;
  }, 0);

  return container;
}
