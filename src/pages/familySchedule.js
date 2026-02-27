import { getAuthState } from '../auth.js';
import { fetchAllConfigs } from '../adapters/scheduling.js';
import { fetchStudentsByFamily } from '../adapters/students.js';
import { formatTime, formatDate, LOCK_TIME_DISPLAY } from '../domain/scheduling.js';
import { isCallbackInvited } from '../domain/callbacks.js';
import { fetchAuditionSettings, fetchVocalDayAssignmentForStudent } from '../adapters/rolePreferences.js';
import { isDayAssignmentMode } from '../domain/rolePreferences.js';
import { escapeHtml } from '../ui/escapeHtml.js';

export function renderFamilySchedule() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Audition Schedule 📅</h1>
    <div id="schedule-content"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    const { user } = getAuthState();
    if (!user) return;

    const [configsResult, studentsResult, settingsResult] = await Promise.all([
      fetchAllConfigs(),
      fetchStudentsByFamily(user.id),
      fetchAuditionSettings(),
    ]);

    const configs = configsResult.data || [];
    const students = studentsResult.data || [];
    const settings = settingsResult.data;
    const contentEl = document.getElementById('schedule-content');
    if (!contentEl) return;

    if (configs.length === 0) {
      contentEl.innerHTML = `
        <div style="text-align:center;padding:var(--space-2xl) 0;color:var(--color-text-secondary)">
          <div style="font-size:2rem;margin-bottom:var(--space-md)">📅</div>
          <p>Audition dates have not been announced yet.</p>
          <p style="font-size:var(--text-small);margin-top:var(--space-sm)">Check back later for the schedule.</p>
        </div>
      `;
      return;
    }

    // Fetch day assignments when in day_assignment mode
    const dayMode = isDayAssignmentMode(settings);
    const dayAssignments = {};
    if (dayMode) {
      await Promise.all(
        students.map(async (s) => {
          const { data } = await fetchVocalDayAssignmentForStudent(s.id);
          if (data) dayAssignments[s.id] = data;
        }),
      );
    }

    const anyInvited = students.some((s) => isCallbackInvited(s));

    // Day assignment banner
    let dayAssignmentBanner = '';
    if (dayMode && students.length > 0) {
      const assignedStudents = students.filter((s) => dayAssignments[s.id]);
      const unassignedStudents = students.filter((s) => !dayAssignments[s.id]);

      if (assignedStudents.length > 0) {
        dayAssignmentBanner += `
          <div class="success-box" style="padding:var(--space-md);border-radius:var(--radius-sm);margin-bottom:var(--space-md)">
            <strong>Vocal Audition Day Assignments</strong>
            ${assignedStudents.map((s) => `
              <p style="font-size:var(--text-small);margin:var(--space-xs) 0 0">
                ${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}: <strong>${formatDate(dayAssignments[s.id].audition_date)}</strong>
              </p>
            `).join('')}
          </div>
        `;
      }

      if (unassignedStudents.length > 0) {
        dayAssignmentBanner += `
          <div class="placeholder-notice" style="margin-bottom:var(--space-md)">
            ${unassignedStudents.map((s) => `${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}`).join(', ')}
            — awaiting vocal audition day assignment.
          </div>
        `;
      }
    }

    contentEl.innerHTML = `
      ${dayAssignmentBanner}
      ${configs
        .map(
          (c) => `
        <div class="card" style="margin-bottom:var(--space-md)">
          <h3 style="margin-bottom:var(--space-sm)">${formatDate(c.audition_date)}</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
            ${c.dance_start_time ? `<p style="font-size:var(--text-small)"><span style="margin-right:var(--space-sm)">🎵</span><strong>Dance:</strong> ${formatTime(c.dance_start_time)} – ${formatTime(c.dance_end_time)}</p>` : ''}
            ${c.vocal_start_time ? `<p style="font-size:var(--text-small)"><span style="margin-right:var(--space-sm)">🎤</span><strong>Vocal:</strong> ${formatTime(c.vocal_start_time)} – ${formatTime(c.vocal_end_time)}</p>` : ''}
            ${anyInvited && c.callback_start_time ? `<p style="font-size:var(--text-small)"><span style="margin-right:var(--space-sm)">⭐</span><strong>Callbacks:</strong> ${formatTime(c.callback_start_time)} – ${formatTime(c.callback_end_time)}</p>` : ''}
          </div>
        </div>
      `,
        )
        .join('')}
      ${anyInvited ? '<div class="enchanted-banner" style="margin-top:var(--space-md)"><div class="enchanted-banner__icon">⭐</div><div class="enchanted-banner__content"><div class="enchanted-banner__title">Callbacks!</div><div class="enchanted-banner__message">One or more of your students has been invited to callbacks! See the times listed above.</div></div></div>' : ''}
      <p class="lock-time-notice" style="margin-top:var(--space-md)">
        Dance and vocal schedules are assigned by staff. Contact the production team for schedule questions.
      </p>
    `;
  }, 0);

  return container;
}
