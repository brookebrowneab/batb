import { getAuthState } from '../auth.js';
import { isAdmin } from '../domain/roles.js';
import { formatTime } from '../domain/scheduling.js';
import { escapeHtml } from '../ui/escapeHtml.js';
import {
  fetchAllDanceSessions,
  fetchDanceRoster,
  fetchSignupCountsBySession,
  generateDanceSessionsFromConfig,
  deleteDanceSession,
  adminUpdateDanceSignup,
} from '../adapters/danceSessions.js';
let sessions = [];
let roster = [];
let counts = {};
let dateFilter = '';

export function renderStaffDanceRoster() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Dance Roster</h1>
    <p><a href="#/staff">&larr; Back to Staff Dashboard</a></p>
    <div id="dance-roster-actions" style="margin-bottom:1rem"></div>
    <div class="form-message" id="roster-msg" aria-live="polite"></div>
    <div id="dance-roster-content"><p>Loading…</p></div>
  `;

  setTimeout(() => loadAndRender(), 0);
  return container;
}

async function loadAndRender() {
  const [sessionsResult, rosterResult, countsResult] = await Promise.all([
    fetchAllDanceSessions(),
    fetchDanceRoster(),
    fetchSignupCountsBySession(),
  ]);

  sessions = sessionsResult.data || [];
  roster = rosterResult.data || [];
  counts = countsResult.data || {};

  renderActions();
  renderContent();
}

function renderActions() {
  const actionsEl = document.getElementById('dance-roster-actions');
  if (!actionsEl) return;
  const { role } = getAuthState();

  actionsEl.innerHTML = `
    <button class="btn-small" id="generate-sessions-btn">Generate Sessions from Config</button>
    ${isAdmin(role) ? '<span style="margin-left:0.5rem;font-size:0.75rem;color:#6c757d">(Admin: you can delete sessions and override sign-ups below)</span>' : ''}
  `;

  document.getElementById('generate-sessions-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('roster-msg');
    btn.disabled = true;
    btn.textContent = 'Generating…';
    if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

    const { user } = getAuthState();
    const { data, error } = await generateDanceSessionsFromConfig(user.id);

    if (error) {
      btn.disabled = false;
      btn.textContent = 'Generate Sessions from Config';
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to generate sessions.'; }
      return;
    }

    const count = data?.length || 0;
    if (msgEl) {
      msgEl.className = 'form-message success';
      msgEl.textContent = count > 0 ? `Generated ${count} session(s).` : 'No new sessions to generate (all dates already have sessions).';
    }
    btn.disabled = false;
    btn.textContent = 'Generate Sessions from Config';
    await loadAndRender();
  });
}

function renderContent() {
  const contentEl = document.getElementById('dance-roster-content');
  if (!contentEl) return;
  const { role } = getAuthState();
  const admin = isAdmin(role);

  if (sessions.length === 0) {
    contentEl.innerHTML = '<div class="placeholder-notice">No dance sessions exist yet. Click "Generate Sessions from Config" to create them.</div>';
    return;
  }

  // Date filter
  const dates = [...new Set(sessions.map((s) => s.audition_date))].sort();
  let html = '<div style="margin-bottom:1rem"><label for="dance-date-filter" style="margin-right:0.5rem"><strong>Filter by date:</strong></label>';
  html += '<select id="dance-date-filter" style="padding:0.4rem;border:1px solid #ced4da;border-radius:4px">';
  html += '<option value="">All dates</option>';
  dates.forEach((d) => {
    html += `<option value="${d}" ${dateFilter === d ? 'selected' : ''}>${d}</option>`;
  });
  html += '</select></div>';

  const filteredSessions = dateFilter ? sessions.filter((s) => s.audition_date === dateFilter) : sessions;

  html += `
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Label</th>
          <th>Capacity</th>
          <th>Signed Up</th>
          ${admin ? '<th>Actions</th>' : ''}
        </tr>
      </thead>
      <tbody>
  `;

  filteredSessions.forEach((s) => {
    const count = counts[s.id] || 0;
    const capText = s.capacity !== null ? `${count} / ${s.capacity}` : `${count}`;
    html += `
      <tr>
        <td>${s.audition_date}</td>
        <td>${formatTime(s.start_time)} – ${formatTime(s.end_time)}</td>
        <td>${escapeHtml(s.label || '—')}</td>
        <td>${s.capacity !== null ? s.capacity : 'Unlimited'}</td>
        <td>${capText}</td>
        ${admin ? `<td><button class="btn-small btn-secondary delete-session-btn" data-id="${s.id}">Delete</button></td>` : ''}
      </tr>
    `;
  });

  html += '</tbody></table>';

  // Roster grouped by session
  html += '<h2 style="margin-top:1.5rem">Attendees by Session</h2>';

  filteredSessions.forEach((s) => {
    const attendees = roster.filter((r) => r.dance_session_id === s.id);
    html += `
      <h3 style="margin-top:1rem">${s.audition_date} — ${s.label ? escapeHtml(s.label) : formatTime(s.start_time) + ' – ' + formatTime(s.end_time)}</h3>
    `;

    if (attendees.length === 0) {
      html += '<p style="font-size:0.875rem;color:#6c757d;margin-bottom:0.5rem">No sign-ups yet.</p>';
    } else {
      html += '<table class="data-table"><thead><tr><th>#</th><th>Student</th><th>Grade</th></tr></thead><tbody>';
      attendees.forEach((a, i) => {
        const st = a.students;
        const profileLink = `#/staff/student-profile?id=${st?.id || ''}`;
        html += `<tr><td>${i + 1}</td><td><a href="${profileLink}">${escapeHtml(st?.first_name || '')} ${escapeHtml(st?.last_name || '')}</a></td><td>${escapeHtml(st?.grade || '—')}</td></tr>`;
      });
      html += '</tbody></table>';
    }
  });

  // Admin override section
  if (admin) {
    html += renderAdminOverride();
  }

  contentEl.innerHTML = html;
  bindContentEvents(contentEl);
}

function renderAdminOverride() {
  const sessionOptions = sessions
    .map((s) => `<option value="${s.id}">${s.audition_date} — ${s.label ? escapeHtml(s.label) : formatTime(s.start_time) + '–' + formatTime(s.end_time)}</option>`)
    .join('');

  return `
    <hr>
    <h2>Admin Override</h2>
    <p style="font-size:0.875rem;color:#6c757d;margin-bottom:0.75rem">Assign or change a student's dance session (bypasses lock time).</p>
    <div class="login-form" style="max-width:500px">
      <label for="override-student-id">Student ID</label>
      <input type="text" id="override-student-id" placeholder="Paste student UUID" />
      <label for="override-session">Dance Session</label>
      <select id="override-session" style="padding:0.5rem;border:1px solid #ced4da;border-radius:4px">
        <option value="">Select a session…</option>
        ${sessionOptions}
      </select>
      <button id="override-btn">Assign Session</button>
      <div class="form-message" id="override-msg" aria-live="polite"></div>
    </div>
  `;
}

function bindContentEvents(contentEl) {
  // Date filter
  const filterEl = document.getElementById('dance-date-filter');
  if (filterEl) {
    filterEl.addEventListener('change', () => {
      dateFilter = filterEl.value;
      renderContent();
    });
  }

  // Delete session buttons
  contentEl.querySelectorAll('.delete-session-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sessionId = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Deleting…';

      const { error } = await deleteDanceSession(sessionId);
      const msgEl = document.getElementById('roster-msg');

      if (error) {
        btn.disabled = false;
        btn.textContent = 'Delete';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to delete session.'; }
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Session deleted.'; }
      await loadAndRender();
    });
  });

  // Admin override button
  const overrideBtn = document.getElementById('override-btn');
  if (overrideBtn) {
    overrideBtn.addEventListener('click', async () => {
      const studentId = document.getElementById('override-student-id')?.value?.trim();
      const sessionId = document.getElementById('override-session')?.value;
      const msgEl = document.getElementById('override-msg');

      if (!studentId || !sessionId) {
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = 'Both student ID and session are required.'; }
        return;
      }

      overrideBtn.disabled = true;
      overrideBtn.textContent = 'Assigning…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const { error } = await adminUpdateDanceSignup(studentId, sessionId);

      if (error) {
        overrideBtn.disabled = false;
        overrideBtn.textContent = 'Assign Session';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Override failed.'; }
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Student assigned to session.'; }
      overrideBtn.disabled = false;
      overrideBtn.textContent = 'Assign Session';
      await loadAndRender();
    });
  }
}
