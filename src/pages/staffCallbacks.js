import { escapeHtml } from '../ui/escapeHtml.js';
import { formatTime, formatDate } from '../domain/scheduling.js';
import {
  isCallbackInvited,
  generateCallbackNotificationContent,
  validateNotificationRecipient,
} from '../domain/callbacks.js';
import {
  toggleCallbackInvite,
  fetchAllStudentsForCallbacks,
  logNotificationSend,
  fetchNotificationHistory,
} from '../adapters/callbacks.js';
import { sendNotificationEmail } from '../adapters/notifications.js';
import { fetchAllConfigs } from '../adapters/scheduling.js';
import { exportFullTrackPdf, exportCallbacksCsv } from '../exports/index.js';
import { createSubmitGuard } from '../ui/rateLimiting.js';

const guardedExportPdf = createSubmitGuard(exportFullTrackPdf);
const guardedExportCsv = createSubmitGuard(exportCallbacksCsv);

let students = [];
let configs = [];
let history = [];
let selectedIds = new Set();

export function renderStaffCallbacks() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Callback Management ⭐</h1>
    <div id="callback-actions" style="margin-bottom:var(--space-md)"></div>
    <div class="form-message" id="callback-msg" aria-live="polite"></div>
    <div id="callback-content"><p>Loading…</p></div>
  `;

  setTimeout(() => loadAndRender(), 0);
  return container;
}

async function loadAndRender() {
  const [studentsResult, configsResult, historyResult] = await Promise.all([
    fetchAllStudentsForCallbacks(),
    fetchAllConfigs(),
    fetchNotificationHistory(),
  ]);

  students = studentsResult.data || [];
  configs = configsResult.data || [];
  history = historyResult.data || [];

  renderActions();
  renderContent();
}

function renderActions() {
  const actionsEl = document.getElementById('callback-actions');
  if (!actionsEl) return;

  const invitedCount = students.filter((s) => isCallbackInvited(s)).length;
  const totalCount = students.length;

  actionsEl.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center;margin-bottom:var(--space-sm)">
      <button class="btn-primary" id="send-all-btn">Send Notifications</button>
      <button class="btn-small" id="export-callbacks-pdf-btn">📄 Full Pack PDF</button>
      <button class="btn-small btn-secondary" id="export-callbacks-csv-btn">📊 CSV</button>
    </div>
    <p style="font-size:var(--text-small);color:var(--color-text-secondary)">
      <strong>${invitedCount}</strong> of <strong>${totalCount}</strong> students invited to callbacks.
      <span style="color:var(--color-text-muted)">(Real email delivery via Resend)</span>
    </p>
  `;

  document.getElementById('send-all-btn')?.addEventListener('click', handleBatchSend);

  document.getElementById('export-callbacks-pdf-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('callback-msg');
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
    btn.textContent = '📄 Full Pack PDF';
  });

  document.getElementById('export-callbacks-csv-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('callback-msg');
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

async function handleBatchSend() {
  const btn = document.getElementById('send-all-btn');
  const msgEl = document.getElementById('callback-msg');
  if (!btn) return;

  const invitedWithEmail = students.filter(
    (s) => isCallbackInvited(s) && validateNotificationRecipient(s).valid,
  );

  if (invitedWithEmail.length === 0) {
    if (msgEl) {
      msgEl.className = 'form-message error';
      msgEl.textContent = 'No invited students with parent email on file.';
    }
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending…';
  if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

  const results = await Promise.allSettled(
    invitedWithEmail.map(async (student) => {
      const { subject, body, bodyPreview } = generateCallbackNotificationContent(student, configs);
      const { error: sendError } = await sendNotificationEmail({
        to: student.parent_email,
        subject,
        text: body,
      });
      if (sendError) throw sendError;
      const { error } = await logNotificationSend(student.id, student.parent_email, subject, bodyPreview);
      if (error) throw error;
      return student.id;
    }),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  btn.disabled = false;
  btn.textContent = 'Send Notifications';

  if (msgEl) {
    if (failed === 0) {
      msgEl.className = 'form-message success';
      msgEl.textContent = `Sent ${sent} notification(s) successfully.`;
    } else {
      msgEl.className = 'form-message error';
      msgEl.textContent = `Sent ${sent}, failed ${failed}. Check console for details.`;
    }
  }

  const { data: newHistory } = await fetchNotificationHistory();
  history = newHistory || [];
  renderContent();
}

function renderContent() {
  const contentEl = document.getElementById('callback-content');
  if (!contentEl) return;

  if (students.length === 0) {
    contentEl.innerHTML = '<div class="placeholder-notice">No students registered yet.</div>';
    return;
  }

  let html = renderStudentTable();
  html += renderBulkActionBar();
  html += renderCallbackWindows();
  html += renderNotificationHistory();

  contentEl.innerHTML = html;
  bindContentEvents(contentEl);
}

function renderStudentTable() {
  const allSelected = students.length > 0 && selectedIds.size === students.length;
  let html = `
    <h2>Students</h2>
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th class="checkbox-cell"><input type="checkbox" id="select-all-cb" ${allSelected ? 'checked' : ''} /></th>
          <th>#</th>
          <th>Name</th>
          <th>Grade</th>
          <th>Registration</th>
          <th>Invited</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  students.forEach((s, i) => {
    const invited = isCallbackInvited(s);
    const recipient = validateNotificationRecipient(s);
    const regStatus = s.registration_complete ? '✓ Complete' : '⏳ Incomplete';
    const regStyle = s.registration_complete ? 'color:var(--color-success)' : 'color:var(--color-error)';
    const checked = selectedIds.has(s.id) ? 'checked' : '';

    html += `
      <tr>
        <td class="checkbox-cell"><input type="checkbox" class="student-cb" data-id="${s.id}" ${checked} /></td>
        <td>${i + 1}</td>
        <td><a href="#/staff/student-profile?id=${s.id}">${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}</a></td>
        <td>${escapeHtml(s.grade || '—')}</td>
        <td style="${regStyle};font-size:var(--text-small)">${regStatus}</td>
        <td>
          <button class="btn-small ${invited ? 'btn-secondary' : ''} invite-toggle-btn"
                  data-id="${s.id}" data-invited="${invited}">
            ${invited ? 'Uninvite' : 'Invite'}
          </button>
        </td>
        <td>
          <button class="btn-small send-one-btn"
                  data-id="${s.id}"
                  ${!invited || !recipient.valid ? 'disabled' : ''}
                  title="${!invited ? 'Not invited' : !recipient.valid ? recipient.reason : 'Send notification'}">
            Send
          </button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  return html;
}

function renderBulkActionBar() {
  if (selectedIds.size === 0) return '';
  return `
    <div class="bulk-action-bar">
      <span class="bulk-action-bar__count">${selectedIds.size} selected</span>
      <div class="bulk-action-bar__actions">
        <button class="btn-accent" id="bulk-invite-btn">Invite Selected (${selectedIds.size})</button>
        <button class="btn-ghost" id="bulk-uninvite-btn" style="color:var(--color-surface);border-color:hsla(0,0%,100%,0.3)">Uninvite Selected</button>
      </div>
    </div>
  `;
}

function renderCallbackWindows() {
  const windowConfigs = configs.filter((c) => c.callback_start_time && c.callback_end_time);

  if (windowConfigs.length === 0) {
    return `<p style="margin-top:var(--space-lg);font-size:var(--text-small);color:var(--color-text-muted)">No callback windows configured yet. Set them in <a href="#/staff/scheduling">Scheduling</a>.</p>`;
  }

  let html = '<h2 style="margin-top:var(--space-xl)">Callback Windows</h2>';
  html += '<table class="data-table"><thead><tr><th>Date</th><th>Start</th><th>End</th></tr></thead><tbody>';
  windowConfigs.forEach((c) => {
    html += `<tr><td>${formatDate(c.audition_date)}</td><td>${formatTime(c.callback_start_time)}</td><td>${formatTime(c.callback_end_time)}</td></tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function renderNotificationHistory() {
  let html = '<h2 style="margin-top:var(--space-xl)">Notification History</h2>';

  if (history.length === 0) {
    html += '<p style="font-size:var(--text-small);color:var(--color-text-muted)">No notifications sent yet.</p>';
    return html;
  }

  html += `
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Student</th>
          <th>Recipient</th>
          <th>Subject</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  history.forEach((h) => {
    const st = h.students;
    const date = new Date(h.created_at).toLocaleString();
    html += `
      <tr>
        <td style="font-size:var(--text-xs)">${escapeHtml(date)}</td>
        <td>${escapeHtml(st?.first_name || '')} ${escapeHtml(st?.last_name || '')}</td>
        <td>${escapeHtml(h.recipient_email)}</td>
        <td>${escapeHtml(h.subject)}</td>
        <td><span class="status-badge--complete">${escapeHtml(h.status)}</span></td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  return html;
}

function bindContentEvents(contentEl) {
  // Select all checkbox
  const selectAllCb = document.getElementById('select-all-cb');
  if (selectAllCb) {
    selectAllCb.addEventListener('change', () => {
      if (selectAllCb.checked) {
        students.forEach((s) => selectedIds.add(s.id));
      } else {
        selectedIds.clear();
      }
      renderContent();
    });
  }

  // Individual checkboxes
  contentEl.querySelectorAll('.student-cb').forEach((cb) => {
    cb.addEventListener('change', () => {
      if (cb.checked) selectedIds.add(cb.dataset.id);
      else selectedIds.delete(cb.dataset.id);
      renderContent();
    });
  });

  // Bulk invite
  const bulkInviteBtn = document.getElementById('bulk-invite-btn');
  if (bulkInviteBtn) {
    bulkInviteBtn.addEventListener('click', async () => {
      const msgEl = document.getElementById('callback-msg');
      bulkInviteBtn.disabled = true;
      bulkInviteBtn.textContent = 'Inviting…';

      for (const id of selectedIds) {
        await toggleCallbackInvite(id, true);
      }

      selectedIds.clear();
      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Selected students invited.'; }
      await loadAndRender();
    });
  }

  // Bulk uninvite
  const bulkUninviteBtn = document.getElementById('bulk-uninvite-btn');
  if (bulkUninviteBtn) {
    bulkUninviteBtn.addEventListener('click', async () => {
      const msgEl = document.getElementById('callback-msg');
      bulkUninviteBtn.disabled = true;
      bulkUninviteBtn.textContent = 'Removing…';

      for (const id of selectedIds) {
        await toggleCallbackInvite(id, false);
      }

      selectedIds.clear();
      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Invites removed for selected students.'; }
      await loadAndRender();
    });
  }

  // Invite toggle buttons
  contentEl.querySelectorAll('.invite-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.id;
      const currentlyInvited = btn.dataset.invited === 'true';
      const newState = !currentlyInvited;

      if (currentlyInvited && !window.confirm('Remove this student\'s callback invite?')) return;

      const msgEl = document.getElementById('callback-msg');

      btn.disabled = true;
      btn.textContent = newState ? 'Inviting…' : 'Removing…';

      const { error } = await toggleCallbackInvite(studentId, newState);

      if (error) {
        btn.disabled = false;
        btn.textContent = currentlyInvited ? 'Uninvite' : 'Invite';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to update invite.'; }
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = newState ? 'Student invited.' : 'Invite removed.'; }
      await loadAndRender();
    });
  });

  // Send individual notification buttons
  contentEl.querySelectorAll('.send-one-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.id;
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      const msgEl = document.getElementById('callback-msg');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      const { subject, body, bodyPreview } = generateCallbackNotificationContent(student, configs);
      const { error: sendError } = await sendNotificationEmail({
        to: student.parent_email,
        subject,
        text: body,
      });
      if (sendError) {
        btn.disabled = false;
        btn.textContent = 'Send';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = sendError.message || 'Failed to send notification.'; }
        return;
      }

      const { error } = await logNotificationSend(student.id, student.parent_email, subject, bodyPreview);

      if (error) {
        btn.disabled = false;
        btn.textContent = 'Send';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to log notification.'; }
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = `Notification sent to ${escapeHtml(student.parent_email)}.`; }

      const { data: newHistory } = await fetchNotificationHistory();
      history = newHistory || [];
      renderContent();
    });
  });
}
