import { getAuthState } from '../auth.js';
import {
  fetchAuditionSettings,
  updateAuditionSettings,
  fetchAuditionRoles,
  createAuditionRole,
  updateAuditionRole,
  deleteAuditionRole,
  fetchRegistrationEmailTemplate,
  upsertRegistrationEmailTemplate,
} from '../adapters/rolePreferences.js';
import { logAuditEntry } from '../adapters/auditLog.js';
import { isAdmin } from '../domain/roles.js';
import { escapeHtml } from '../ui/escapeHtml.js';

let settings = null;
let roles = [];
let registrationEmailTemplate = null;

const DEFAULT_TEMPLATE = {
  show_title: 'Beauty and the Beast',
  subject_template: '{{Title of the Show}} Audition Details - Please Review',
  body_template: `Hi {{Student Name}} and Family,

We're excited to get auditions underway for {{Title of the Show}} - thank you for signing up!

Please review the required audition materials for:
- Belle
- Lumiere
- Mrs. Potts
- Gaston
- Le Feu

All songs, tracks, and instructions are here:
https://practice-batb.adcatheatre.com/

Each student will be assigned:
- Dance Day: {{Dance Day Date}} ({{Dance Start Time}}-{{Dance End Time}})
- Vocal Day: {{Vocal Day Date}} ({{Vocal Start Time}}-{{Vocal End Time}})

Please also keep callback date(s) - {{Callback Date(s)}} ({{Callback Start Time}}-{{Callback End Time}}) - open in case your student is invited back.

Students should come prepared and comfortable with the posted materials. The more prepared they are, the more confident and focused they'll feel in the room.

We're looking forward to a strong, fun start to the season. Thank you for being part of it!

Warmly,
[Your Name]
[Production Team / Organization Name]`,
};

async function loadData() {
  const [settingsResult, rolesResult, templateResult] = await Promise.all([
    fetchAuditionSettings(),
    fetchAuditionRoles(),
    fetchRegistrationEmailTemplate(),
  ]);
  if (settingsResult.data) settings = settingsResult.data;
  if (rolesResult.data) roles = rolesResult.data;
  registrationEmailTemplate = templateResult.data || { ...DEFAULT_TEMPLATE };
}

function renderModeToggle() {
  const mode = settings?.vocal_mode || 'timeslot';
  return `
    <div class="card" style="margin-bottom:var(--space-lg)">
      <h2 style="margin-top:0">Vocal Audition Mode</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Choose how families sign up for vocal auditions.
      </p>
      <div style="display:flex;gap:var(--space-md);flex-wrap:wrap">
        <label class="mode-option ${mode === 'timeslot' ? 'mode-option--active' : ''}" style="cursor:pointer;display:flex;align-items:flex-start;gap:var(--space-sm);padding:var(--space-md);border:2px solid ${mode === 'timeslot' ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:var(--radius-md);flex:1;min-width:200px">
          <input type="radio" name="vocal-mode" value="timeslot" ${mode === 'timeslot' ? 'checked' : ''} />
          <div>
            <strong>Timeslot Mode</strong>
            <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin:var(--space-xs) 0 0">
              Families pick their own 15-minute vocal audition time slot.
            </p>
          </div>
        </label>
        <label class="mode-option ${mode === 'day_assignment' ? 'mode-option--active' : ''}" style="cursor:pointer;display:flex;align-items:flex-start;gap:var(--space-sm);padding:var(--space-md);border:2px solid ${mode === 'day_assignment' ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:var(--radius-md);flex:1;min-width:200px">
          <input type="radio" name="vocal-mode" value="day_assignment" ${mode === 'day_assignment' ? 'checked' : ''} />
          <div>
            <strong>Day Assignment Mode</strong>
            <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin:var(--space-xs) 0 0">
              Students select role preferences during registration. Director assigns students to audition days.
            </p>
          </div>
        </label>
      </div>
      <div id="mode-msg" class="form-message" aria-live="polite" style="margin-top:var(--space-sm)"></div>
    </div>
  `;
}

function renderRolesTable() {
  const { role } = getAuthState();
  if (roles.length === 0) {
    return '<p style="color:var(--color-text-secondary)">No audition roles defined yet. Add one below.</p>';
  }

  return `
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Role Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${roles
          .map(
            (r) => `
          <tr>
            <td>${r.display_order}</td>
            <td>${escapeHtml(r.name)}</td>
            <td>
              <button class="btn-small" data-edit-role="${r.id}">Edit</button>
              ${isAdmin(role) ? `<button class="btn-small btn-secondary" data-delete-role="${r.id}">Delete</button>` : ''}
            </td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>
    </div>
  `;
}

function renderRoleForm(existing) {
  const r = existing || {};
  const isEdit = Boolean(existing);
  const nextOrder = roles.length > 0 ? Math.max(...roles.map((x) => x.display_order)) + 1 : 1;

  return `
    <form id="role-form" class="login-form" style="margin-top:var(--space-md)">
      <h3>${isEdit ? 'Edit' : 'Add'} Audition Role</h3>
      ${isEdit ? `<input type="hidden" id="role-id" value="${r.id}" />` : ''}
      <label for="role-name">Role Name *</label>
      <input type="text" id="role-name" required value="${escapeHtml(r.name || '')}" placeholder="e.g. Belle, Beast, Ensemble" />
      <label for="role-order">Display Order</label>
      <input type="number" id="role-order" value="${r.display_order ?? nextOrder}" min="0" />
      <button type="submit">${isEdit ? 'Update' : 'Add'} Role</button>
      ${isEdit ? '<button type="button" id="cancel-role-edit" class="btn-small btn-secondary" style="margin-top:0.25rem">Cancel</button>' : ''}
      <div id="role-form-msg" class="form-message" aria-live="polite"></div>
    </form>
  `;
}

function renderTemplateEditor() {
  const t = registrationEmailTemplate || DEFAULT_TEMPLATE;
  return `
    <div class="card" style="margin-bottom:var(--space-lg)">
      <h2 style="margin-top:0">Registration Schedule Email Template</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        This email is sent automatically when a student completes registration.
      </p>
      <form id="registration-email-template-form" class="login-form" style="max-width:100%">
        <label for="registration-show-title">Title of the Show</label>
        <input type="text" id="registration-show-title" value="${escapeHtml(t.show_title || '')}" placeholder="Beauty and the Beast" />

        <label for="registration-email-subject">Subject Template</label>
        <input type="text" id="registration-email-subject" value="${escapeHtml(t.subject_template || '')}" />

        <label for="registration-email-body">Body Template</label>
        <textarea id="registration-email-body" rows="16" style="width:100%;font-family:var(--font-mono);padding:0.75rem">${escapeHtml(t.body_template || '')}</textarea>

        <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin:0">
          Available placeholders: {{Title of the Show}}, {{Student Name}}, {{Dance Day Date}}, {{Dance Start Time}}, {{Dance End Time}},
          {{Vocal Day Date}}, {{Vocal Start Time}}, {{Vocal End Time}}, {{Callback Date(s)}}, {{Callback Start Time}}, {{Callback End Time}}
        </p>

        <button type="submit">Save Email Template</button>
        <div id="registration-email-template-msg" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `;
}

function bindEvents(refreshFn) {
  // Mode toggle
  document.querySelectorAll('input[name="vocal-mode"]').forEach((radio) => {
    radio.addEventListener('change', async () => {
      const { user } = getAuthState();
      const msg = document.getElementById('mode-msg');
      const newMode = radio.value;

      if (msg) {
        msg.textContent = 'Saving…';
        msg.className = 'form-message';
      }

      const { data, error } = await updateAuditionSettings({ vocal_mode: newMode }, user.id);

      if (error) {
        if (msg) {
          msg.textContent = 'Error: ' + error.message;
          msg.className = 'form-message error';
        }
        return;
      }

      const settingsId = data?.id || settings?.id || null;
      logAuditEntry('update_vocal_mode', 'audition_settings', settingsId, { vocal_mode: newMode });

      if (msg) {
        msg.textContent = `Switched to ${newMode === 'timeslot' ? 'Timeslot' : 'Day Assignment'} mode.`;
        msg.className = 'form-message success';
      }

      settings = data || { ...(settings || {}), vocal_mode: newMode };
      // Re-render mode toggle to update styling
      const modeContainer = document.getElementById('mode-toggle-container');
      if (modeContainer) {
        modeContainer.innerHTML = renderModeToggle();
        bindEvents(refreshFn);
      }
    });
  });

  // Edit role buttons
  document.querySelectorAll('[data-edit-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const roleId = btn.getAttribute('data-edit-role');
      const role = roles.find((r) => r.id === roleId);
      if (role) {
        const formEl = document.getElementById('role-form-container');
        if (formEl) {
          formEl.innerHTML = renderRoleForm(role);
          bindRoleFormSubmit(refreshFn);
        }
      }
    });
  });

  // Delete role buttons
  document.querySelectorAll('[data-delete-role]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const roleId = btn.getAttribute('data-delete-role');
      const role = roles.find((r) => r.id === roleId);
      if (!window.confirm(`Delete role "${role?.name || ''}"? This will also remove all student preferences for this role.`)) return;
      btn.disabled = true;
      const { error } = await deleteAuditionRole(roleId);
      if (error) {
        alert('Failed to delete: ' + error.message);
        btn.disabled = false;
        return;
      }
      refreshFn();
    });
  });

  bindRoleFormSubmit(refreshFn);

  const templateForm = document.getElementById('registration-email-template-form');
  if (templateForm) {
    templateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { user } = getAuthState();
      const msg = document.getElementById('registration-email-template-msg');
      const submitBtn = templateForm.querySelector('button[type="submit"]');
      const showTitle = document.getElementById('registration-show-title')?.value?.trim() || '';
      const subjectTemplate = document.getElementById('registration-email-subject')?.value?.trim() || '';
      const bodyTemplate = document.getElementById('registration-email-body')?.value?.trim() || '';

      if (!showTitle || !subjectTemplate || !bodyTemplate) {
        if (msg) {
          msg.textContent = 'Show title, subject, and body are required.';
          msg.className = 'form-message error';
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';
      if (msg) {
        msg.textContent = '';
        msg.className = 'form-message';
      }

      const { data, error } = await upsertRegistrationEmailTemplate({
        show_title: showTitle,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
      }, user.id);

      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Email Template';

      if (error) {
        if (msg) {
          msg.textContent = 'Error: ' + error.message;
          msg.className = 'form-message error';
        }
        return;
      }

      registrationEmailTemplate = data || {
        show_title: showTitle,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
      };

      logAuditEntry('update_registration_email_template', 'registration_email_templates', data?.id || null, {
        show_title: showTitle,
      });

      if (msg) {
        msg.textContent = 'Template saved.';
        msg.className = 'form-message success';
      }
    });
  }
}

function bindRoleFormSubmit(refreshFn) {
  const form = document.getElementById('role-form');
  if (!form) return;

  const cancelBtn = document.getElementById('cancel-role-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const formEl = document.getElementById('role-form-container');
      if (formEl) {
        formEl.innerHTML = renderRoleForm(null);
        bindRoleFormSubmit(refreshFn);
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { user } = getAuthState();
    const msg = document.getElementById('role-form-msg');
    const btn = form.querySelector('button[type="submit"]');

    const roleIdEl = document.getElementById('role-id');
    const isEdit = Boolean(roleIdEl);

    const name = document.getElementById('role-name').value.trim();
    const displayOrder = parseInt(document.getElementById('role-order').value, 10) || 0;

    if (!name) {
      if (msg) {
        msg.textContent = 'Role name is required.';
        msg.className = 'form-message error';
      }
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving…';
    if (msg) msg.textContent = '';

    let result;
    if (isEdit) {
      result = await updateAuditionRole(roleIdEl.value, { name, display_order: displayOrder }, user.id);
    } else {
      result = await createAuditionRole(name, displayOrder, user.id);
    }

    if (result.error) {
      if (msg) {
        msg.textContent = 'Error: ' + result.error.message;
        msg.className = 'form-message error';
      }
      btn.disabled = false;
      btn.textContent = isEdit ? 'Update Role' : 'Add Role';
      return;
    }

    // Audit log
    if (isEdit) {
      logAuditEntry('update_role', 'audition_roles', roleIdEl.value, { name, display_order: displayOrder });
    } else if (result.data) {
      logAuditEntry('create_role', 'audition_roles', result.data.id, { name, display_order: displayOrder });
    }

    if (msg) {
      msg.textContent = isEdit ? 'Updated!' : 'Added!';
      msg.className = 'form-message success';
    }

    setTimeout(() => refreshFn(), 300);
  });
}

export function renderStaffRoleConfig() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Audition Roles</h1>
      <button class="btn-ghost" onclick="location.hash='#/staff'" style="min-height:auto;width:auto">← Dashboard</button>
    </div>
    <div id="mode-toggle-container"></div>
    <div id="registration-email-template-container"></div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <h2 style="margin-top:0">Roles</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Define the roles students can audition for. Students will rank these during registration when Day Assignment mode is active.
      </p>
      <div id="roles-table"><p>Loading…</p></div>
    </div>
    <div class="card" id="role-form-container"></div>
  `;

  async function refresh() {
    await loadData();
    const modeEl = document.getElementById('mode-toggle-container');
    const templateEl = document.getElementById('registration-email-template-container');
    const tableEl = document.getElementById('roles-table');
    const formEl = document.getElementById('role-form-container');
    if (modeEl) modeEl.innerHTML = renderModeToggle();
    if (templateEl) templateEl.innerHTML = renderTemplateEditor();
    if (tableEl) tableEl.innerHTML = renderRolesTable();
    if (formEl) formEl.innerHTML = renderRoleForm(null);
    bindEvents(refresh);
  }

  setTimeout(refresh, 0);
  return container;
}
