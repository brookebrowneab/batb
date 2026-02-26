import { fetchAllConfigs } from '../adapters/scheduling.js';
import { formatTime, LOCK_TIME_DISPLAY } from '../domain/scheduling.js';

export function renderFamilySchedule() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Audition Schedule</h1>
    <p><a href="#/family">&larr; Back to Family Dashboard</a></p>
    <div id="schedule-content"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    const { data: configs } = await fetchAllConfigs();
    const contentEl = document.getElementById('schedule-content');
    if (!contentEl) return;

    if (!configs || configs.length === 0) {
      contentEl.innerHTML = '<div class="placeholder-notice">Audition dates have not been announced yet.</div>';
      return;
    }

    contentEl.innerHTML = `
      ${configs
        .map(
          (c) => `
        <div class="student-card" style="background:#f8f9fa;border:1px solid #dee2e6">
          <h3>${c.audition_date}</h3>
          ${c.dance_start_time ? `<p><strong>Dance:</strong> ${formatTime(c.dance_start_time)} – ${formatTime(c.dance_end_time)}</p>` : ''}
          ${c.vocal_start_time ? `<p><strong>Vocal:</strong> ${formatTime(c.vocal_start_time)} – ${formatTime(c.vocal_end_time)}</p>` : ''}
          ${c.callback_start_time ? `<p><strong>Callbacks:</strong> ${formatTime(c.callback_start_time)} – ${formatTime(c.callback_end_time)}</p>` : ''}
        </div>
      `,
        )
        .join('')}
      <p class="lock-time-notice" style="margin-top:1rem;font-size:0.875rem;color:#6c757d">
        Changes to your sign-ups are locked at <strong>${LOCK_TIME_DISPLAY}</strong>. After that, only an admin can make changes.
      </p>
    `;
  }, 0);

  return container;
}
