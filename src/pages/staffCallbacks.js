import { escapeHtml } from '../ui/escapeHtml.js';
import { formatTime } from '../domain/scheduling.js';
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
import { fetchAllConfigs } from '../adapters/scheduling.js';

let students = [];
let configs = [];
let history = [];

export function renderStaffCallbacks() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Callback Management</h1>
    <p><a href="#/staff">&larr; Back to Staff Dashboard</a></p>
    <div id="callback-actions" style="margin-bottom:1rem"></div>
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
    <p style="margin-bottom:0.5rem"><strong>${invitedCount}</strong> of <strong>${totalCount}</strong> students invited to callbacks.</p>
    <button class="btn-small" id="send-all-btn">Send Callback Notifications</button>
    <span style="margin-left:0.5rem;font-size:0.75rem;color:#6c757d">Sends to all invited students with a parent email on file (mock provider).</span>
  `;

  document.getElementById('send-all-btn')?.addEventListener('click', handleBatchSend);
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
      // Mock email send — log to console
      console.log(`[MOCK EMAIL] To: ${student.parent_email} | Subject: ${subject}\n${body}`);
      // Audit log via RPC
      const { error } = await logNotificationSend(student.id, student.parent_email, subject, bodyPreview);
      if (error) throw error;
      return student.id;
    }),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  btn.disabled = false;
  btn.textContent = 'Send Callback Notifications';

  if (msgEl) {
    if (failed === 0) {
      msgEl.className = 'form-message success';
      msgEl.textContent = `Sent ${sent} notification(s) successfully.`;
    } else {
      msgEl.className = 'form-message error';
      msgEl.textContent = `Sent ${sent}, failed ${failed}. Check console for details.`;
    }
  }

  // Reload history
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
  html += renderCallbackWindows();
  html += renderNotificationHistory();

  contentEl.innerHTML = html;
  bindContentEvents(contentEl);
}

function renderStudentTable() {
  let html = `
    <h2>Students</h2>
    <table class="data-table">
      <thead>
        <tr>
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
    const regStatus = s.registration_complete ? 'Complete' : 'Incomplete';
    const regClass = s.registration_complete ? 'color:#28a745' : 'color:#dc3545';

    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}</td>
        <td>${escapeHtml(s.grade || '—')}</td>
        <td style="${regClass}">${regStatus}</td>
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

  html += '</tbody></table>';
  return html;
}

function renderCallbackWindows() {
  const windowConfigs = configs.filter((c) => c.callback_start_time && c.callback_end_time);

  if (windowConfigs.length === 0) {
    return '<p style="margin-top:1rem;font-size:0.875rem;color:#6c757d">No callback windows configured yet. Set them in <a href="#/staff/scheduling">Scheduling Configuration</a>.</p>';
  }

  let html = '<h2 style="margin-top:1.5rem">Callback Windows</h2>';
  html += '<table class="data-table"><thead><tr><th>Date</th><th>Start</th><th>End</th></tr></thead><tbody>';
  windowConfigs.forEach((c) => {
    html += `<tr><td>${c.audition_date}</td><td>${formatTime(c.callback_start_time)}</td><td>${formatTime(c.callback_end_time)}</td></tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function renderNotificationHistory() {
  let html = '<h2 style="margin-top:1.5rem">Notification History</h2>';

  if (history.length === 0) {
    html += '<p style="font-size:0.875rem;color:#6c757d">No notifications sent yet.</p>';
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
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(st?.first_name || '')} ${escapeHtml(st?.last_name || '')}</td>
        <td>${escapeHtml(h.recipient_email)}</td>
        <td>${escapeHtml(h.subject)}</td>
        <td>${escapeHtml(h.status)}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  return html;
}

function bindContentEvents(contentEl) {
  // Invite toggle buttons
  contentEl.querySelectorAll('.invite-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.id;
      const currentlyInvited = btn.dataset.invited === 'true';
      const newState = !currentlyInvited;
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
      console.log(`[MOCK EMAIL] To: ${student.parent_email} | Subject: ${subject}\n${body}`);

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
