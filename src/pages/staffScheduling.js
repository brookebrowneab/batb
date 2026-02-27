import { getAuthState } from '../auth.js';
import { fetchAllConfigs, createConfig, updateConfig, deleteConfig } from '../adapters/scheduling.js';
import { logAuditEntry } from '../adapters/auditLog.js';
import { validateWindowConfig, formatTime, formatDate, LOCK_TIME_DISPLAY } from '../domain/scheduling.js';
import { isAdmin } from '../domain/roles.js';

let configs = [];

async function loadConfigs() {
  const { data, error } = await fetchAllConfigs();
  if (error) {
    console.error('Failed to load configs:', error.message);
    return;
  }
  configs = data;
}

function renderConfigTable() {
  const { role } = getAuthState();
  if (configs.length === 0) {
    return '<p>No audition dates configured yet.</p>';
  }

  return `
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Dance</th>
          <th>Vocal</th>
          <th>Callback</th>
          <th>Last Updated By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${configs
          .map(
            (c) => `
          <tr>
            <td>${formatDate(c.audition_date)}</td>
            <td>${formatTime(c.dance_start_time)} – ${formatTime(c.dance_end_time)}</td>
            <td>${formatTime(c.vocal_start_time)} – ${formatTime(c.vocal_end_time)}</td>
            <td>${formatTime(c.callback_start_time)} – ${formatTime(c.callback_end_time)}</td>
            <td>${new Date(c.updated_at).toLocaleString()}</td>
            <td>
              <button class="btn-small" data-edit="${c.id}">Edit</button>
              ${isAdmin(role) ? `<button class="btn-small btn-secondary" data-delete="${c.id}">Delete</button>` : ''}
            </td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>
    </div>
    <p class="lock-time-notice">Lock time: ${LOCK_TIME_DISPLAY} (server-enforced, admin override only)</p>
  `;
}

function renderConfigForm(existing) {
  const c = existing || {};
  const isEdit = Boolean(existing);
  return `
    <form id="config-form" class="login-form">
      <h3>${isEdit ? 'Edit' : 'Add'} Audition Date</h3>
      ${isEdit ? `<input type="hidden" id="config-id" value="${c.id}" />` : ''}
      <label for="cfg-date">Audition Date *</label>
      <input type="date" id="cfg-date" required value="${c.audition_date || ''}" ${isEdit ? 'readonly' : ''} />

      <label for="cfg-dance-start">Dance Start Time</label>
      <input type="time" id="cfg-dance-start" value="${c.dance_start_time || ''}" />
      <label for="cfg-dance-end">Dance End Time</label>
      <input type="time" id="cfg-dance-end" value="${c.dance_end_time || ''}" />

      <label for="cfg-vocal-start">Vocal Start Time</label>
      <input type="time" id="cfg-vocal-start" value="${c.vocal_start_time || ''}" />
      <label for="cfg-vocal-end">Vocal End Time</label>
      <input type="time" id="cfg-vocal-end" value="${c.vocal_end_time || ''}" />

      <label for="cfg-callback-start">Callback Start Time</label>
      <input type="time" id="cfg-callback-start" value="${c.callback_start_time || ''}" />
      <label for="cfg-callback-end">Callback End Time</label>
      <input type="time" id="cfg-callback-end" value="${c.callback_end_time || ''}" />

      <button type="submit">${isEdit ? 'Update' : 'Add'} Date</button>
      ${isEdit ? '<button type="button" id="cancel-edit" class="btn-small btn-secondary" style="margin-top:0.25rem">Cancel</button>' : ''}
      <div id="config-form-msg" class="form-message" aria-live="polite"></div>
    </form>
  `;
}

function bindEvents(refreshFn) {

  // Edit buttons
  document.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const configId = btn.getAttribute('data-edit');
      const config = configs.find((c) => c.id === configId);
      if (config) {
        const formEl = document.getElementById('config-form-container');
        if (formEl) {
          formEl.innerHTML = renderConfigForm(config);
          bindFormSubmit(refreshFn);
        }
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const configId = btn.getAttribute('data-delete');
      if (!window.confirm('Delete this audition date config?')) return;
      btn.disabled = true;
      const { error } = await deleteConfig(configId);
      if (error) {
        alert('Failed to delete: ' + error.message);
        btn.disabled = false;
        return;
      }
      refreshFn();
    });
  });

  bindFormSubmit(refreshFn);
}

function bindFormSubmit(refreshFn) {
  const form = document.getElementById('config-form');
  if (!form) return;

  const cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const formEl = document.getElementById('config-form-container');
      if (formEl) {
        formEl.innerHTML = renderConfigForm(null);
        bindFormSubmit(refreshFn);
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { user } = getAuthState();
    const msg = document.getElementById('config-form-msg');
    const btn = form.querySelector('button[type="submit"]');

    const configIdEl = document.getElementById('config-id');
    const isEdit = Boolean(configIdEl);

    const fields = {
      audition_date: document.getElementById('cfg-date').value,
      dance_start_time: document.getElementById('cfg-dance-start').value || null,
      dance_end_time: document.getElementById('cfg-dance-end').value || null,
      vocal_start_time: document.getElementById('cfg-vocal-start').value || null,
      vocal_end_time: document.getElementById('cfg-vocal-end').value || null,
      callback_start_time: document.getElementById('cfg-callback-start').value || null,
      callback_end_time: document.getElementById('cfg-callback-end').value || null,
    };

    const { valid, errors } = validateWindowConfig(fields);
    if (!valid) {
      msg.textContent = errors.join(' ');
      msg.className = 'form-message error';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving…';
    msg.textContent = '';

    let result;
    if (isEdit) {
      const updateFields = { ...fields };
      delete updateFields.audition_date;
      result = await updateConfig(configIdEl.value, updateFields, user.id);
    } else {
      result = await createConfig(fields, user.id);
    }

    if (result.error) {
      msg.textContent = 'Error: ' + result.error.message;
      msg.className = 'form-message error';
      btn.disabled = false;
      btn.textContent = isEdit ? 'Update Date' : 'Add Date';
      return;
    }

    // Audit log
    if (isEdit) {
      logAuditEntry('update_config', 'audition_window_config', configIdEl.value, fields);
    } else if (result.data) {
      logAuditEntry('create_config', 'audition_window_config', result.data.id, fields);
    }

    msg.textContent = isEdit ? 'Updated!' : 'Added!';
    msg.className = 'form-message success';
    refreshFn();
  });
}

export function renderStaffScheduling() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Scheduling Configuration</h1>
    <p><a href="#/staff">&larr; Back to Staff Dashboard</a></p>
    <div id="config-table"><p>Loading…</p></div>
    <div id="config-form-container"></div>
  `;

  async function refresh() {
    await loadConfigs();
    const tableEl = document.getElementById('config-table');
    const formEl = document.getElementById('config-form-container');
    if (tableEl) {
      tableEl.innerHTML = renderConfigTable();
    }
    if (formEl) {
      formEl.innerHTML = renderConfigForm(null);
    }
    bindEvents(refresh);
  }

  setTimeout(refresh, 0);
  return container;
}
