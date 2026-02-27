import { formatTime, formatDate } from '../domain/scheduling.js';
import { escapeHtml } from '../ui/escapeHtml.js';
import {
  fetchDanceWindowsFromConfig,
  fetchAssignedDanceRoster,
} from '../adapters/danceSessions.js';
import { exportDanceSessionPdf, exportDanceRosterCsv } from '../exports/index.js';
import { createSubmitGuard } from '../ui/rateLimiting.js';

const guardedExportPdf = createSubmitGuard(exportDanceSessionPdf);
const guardedExportCsv = createSubmitGuard(exportDanceRosterCsv);
let danceWindows = [];
let roster = [];
let dateFilter = '';

export function renderStaffDanceRoster() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Dance Roster 🎵</h1>
    <div id="dance-roster-actions" style="margin-bottom:var(--space-md)"></div>
    <div class="form-message" id="roster-msg" aria-live="polite"></div>
    <div id="dance-roster-content"><p>Loading…</p></div>
  `;

  setTimeout(() => loadAndRender(), 0);
  return container;
}

async function loadAndRender() {
  const [windowsResult, rosterResult] = await Promise.all([
    fetchDanceWindowsFromConfig(),
    fetchAssignedDanceRoster(),
  ]);

  danceWindows = windowsResult.data || [];
  roster = rosterResult.data || [];

  renderActions();
  renderContent();
}

function renderActions() {
  const actionsEl = document.getElementById('dance-roster-actions');
  if (!actionsEl) return;

  actionsEl.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center">
      <button class="btn-small" id="export-dance-pdf-btn">📄 PDF</button>
      <button class="btn-small btn-secondary" id="export-dance-csv-btn">📊 CSV</button>
      <span style="font-size:var(--text-xs);color:var(--color-text-muted)">Dance roster is auto-assigned from scheduling config.</span>
    </div>
  `;

  document.getElementById('export-dance-pdf-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('roster-msg');
    btn.disabled = true;
    btn.textContent = 'Generating…';
    if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }
    try {
      await guardedExportPdf();
      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'PDF downloaded.'; }
    } catch (err) {
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = err.message || 'Export failed.'; }
    }
    btn.disabled = false;
    btn.textContent = '📄 PDF';
  });

  document.getElementById('export-dance-csv-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('roster-msg');
    btn.disabled = true;
    btn.textContent = 'Exporting…';
    try {
      await guardedExportCsv();
      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'CSV downloaded.'; }
    } catch (err) {
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = err.message || 'Export failed.'; }
    }
    btn.disabled = false;
    btn.textContent = '📊 CSV';
  });
}

function renderContent() {
  const contentEl = document.getElementById('dance-roster-content');
  if (!contentEl) return;

  if (danceWindows.length === 0) {
    contentEl.innerHTML = '<div class="placeholder-notice">No dance windows configured yet. Set dance times in Scheduling.</div>';
    return;
  }

  const dates = [...new Set(danceWindows.map((window) => window.audition_date))].sort();
  let html = `<div style="margin-bottom:var(--space-md)"><label for="dance-date-filter" style="margin-right:var(--space-sm);font-weight:600;font-size:var(--text-small)">Filter by date:</label>`;
  html += `<select id="dance-date-filter" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:var(--text-small)">`;
  html += '<option value="">All dates</option>';
  dates.forEach((date) => {
    html += `<option value="${date}" ${dateFilter === date ? 'selected' : ''}>${formatDate(date)}</option>`;
  });
  html += '</select></div>';

  const filteredWindows = dateFilter
    ? danceWindows.filter((window) => window.audition_date === dateFilter)
    : danceWindows;

  html += `
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Dance Window</th>
          <th>Assigned Students</th>
        </tr>
      </thead>
      <tbody>
  `;

  filteredWindows.forEach((window) => {
    const assigned = roster.filter((entry) => entry.dance_window_id === window.id);
    html += `
      <tr>
        <td>${formatDate(window.audition_date)}</td>
        <td>${formatTime(window.start_time)} – ${formatTime(window.end_time)}</td>
        <td>${assigned.length}</td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  html += '<h2 style="margin-top:var(--space-xl)">Attendees by Dance Window</h2>';

  filteredWindows.forEach((window) => {
    const attendees = roster.filter((entry) => entry.dance_window_id === window.id);
    html += `<h3 style="margin-top:var(--space-md)">${formatDate(window.audition_date)} — ${formatTime(window.start_time)} – ${formatTime(window.end_time)}</h3>`;

    if (attendees.length === 0) {
      html += '<p style="font-size:var(--text-small);color:var(--color-text-muted);margin-bottom:var(--space-sm)">No assigned students yet.</p>';
    } else {
      html += '<table class="data-table"><thead><tr><th>#</th><th>Student</th><th>Grade</th></tr></thead><tbody>';
      attendees.forEach((entry, idx) => {
        const st = entry.students;
        const profileLink = `#/staff/student-profile?id=${st?.id || ''}`;
        html += `<tr><td>${idx + 1}</td><td><a href="${profileLink}">${escapeHtml(st?.first_name || '')} ${escapeHtml(st?.last_name || '')}</a></td><td>${escapeHtml(st?.grade || '—')}</td></tr>`;
      });
      html += '</tbody></table>';
    }
  });

  contentEl.innerHTML = html;
  bindContentEvents(contentEl);
}

function bindContentEvents(contentEl) {
  const filterEl = document.getElementById('dance-date-filter');
  if (filterEl) {
    filterEl.addEventListener('change', () => {
      dateFilter = filterEl.value;
      renderContent();
    });
  }
}
