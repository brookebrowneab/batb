import { getAuthState } from '../auth.js';
import { escapeHtml } from '../ui/escapeHtml.js';
import { formatDate } from '../domain/scheduling.js';
import {
  groupStudentsByTopRole,
  sortPreferencesByRank,
  generateDayAssignmentNotificationContent,
} from '../domain/rolePreferences.js';
import { validateNotificationRecipient } from '../domain/callbacks.js';
import {
  fetchAuditionRoles,
  fetchRoleDayMappings,
  fetchAllStudentsWithPreferences,
  fetchAllVocalDayAssignments,
  assignVocalDay,
  unassignVocalDay,
  logDayAssignmentNotification,
  upsertRoleDayMapping,
  deleteRoleDayMapping,
} from '../adapters/rolePreferences.js';
import { fetchAllConfigs } from '../adapters/scheduling.js';
import { fetchNotificationHistory } from '../adapters/callbacks.js';
import { sendNotificationEmail } from '../adapters/notifications.js';

let roles = [];
let students = [];
let assignments = [];
let configs = [];
let history = [];
let roleDayMappings = [];
let selectedIds = new Set();
let filterRoleId = '';

export function renderStaffVocalAssignments() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Vocal Day Assignments</h1>
      <button class="btn-ghost" onclick="location.hash='#/staff'" style="min-height:auto;width:auto">← Dashboard</button>
    </div>
    <div class="form-message" id="assign-msg" aria-live="polite"></div>
    <div id="assign-content"><p>Loading…</p></div>
  `;

  setTimeout(() => loadAndRender(), 0);
  return container;
}

async function loadAndRender() {
  const [rolesResult, mappingsResult, studentsResult, assignmentsResult, configsResult, historyResult] = await Promise.all([
    fetchAuditionRoles(),
    fetchRoleDayMappings(),
    fetchAllStudentsWithPreferences(),
    fetchAllVocalDayAssignments(),
    fetchAllConfigs(),
    fetchNotificationHistory(),
  ]);

  roles = rolesResult.data || [];
  roleDayMappings = mappingsResult.data || [];
  students = studentsResult.data || [];
  assignments = assignmentsResult.data || [];
  configs = configsResult.data || [];
  history = historyResult.data || [];

  const msgEl = document.getElementById('assign-msg');
  const firstError = rolesResult.error
    || mappingsResult.error
    || studentsResult.error
    || assignmentsResult.error
    || configsResult.error
    || historyResult.error;
  if (msgEl && firstError) {
    msgEl.className = 'form-message error';
    msgEl.textContent = firstError.message || 'Failed to load assignment data.';
  }

  // Merge day_assignment onto students
  const assignMap = new Map(assignments.map((a) => [a.student_id, a]));
  students = students.map((s) => ({
    ...s,
    day_assignment: assignMap.get(s.id) || null,
  }));

  renderContent();
}

function renderContent() {
  const contentEl = document.getElementById('assign-content');
  if (!contentEl) return;

  if (roles.length === 0) {
    contentEl.innerHTML = `
      <div class="placeholder-notice">
        No audition roles defined yet. <a href="#/staff/roles">Configure roles first</a>.
      </div>
    `;
    return;
  }

  if (students.length === 0) {
    contentEl.innerHTML = '<div class="placeholder-notice">No registered students found.</div>';
    return;
  }

  const auditionDates = configs.map((c) => c.audition_date);
  if (auditionDates.length === 0) {
    contentEl.innerHTML = `
      <div class="placeholder-notice">
        No audition dates configured. <a href="#/staff/scheduling">Set up scheduling first</a>.
      </div>
    `;
    return;
  }

  let html = '';
  html += renderRoleDayMappingSection(auditionDates);
  html += renderFilterBar();
  html += renderStudentTable(auditionDates);
  html += renderBulkActionBar(auditionDates);
  html += renderAssignmentSummary(auditionDates);
  html += renderNotificationSection();
  html += renderNotificationHistory();

  contentEl.innerHTML = html;
  bindContentEvents(contentEl, auditionDates);
}

function getMappedDateForRole(roleId) {
  return roleDayMappings.find((mapping) => mapping.audition_role_id === roleId)?.audition_date || '';
}

function renderRoleDayMappingSection(auditionDates) {
  const dateOptions = auditionDates.map((d) =>
    `<option value="${d}">${formatDate(d)}</option>`
  ).join('');

  const rows = roles.map((role) => {
    const mappedDate = getMappedDateForRole(role.id);
    return `
      <div style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-xs) 0;border-bottom:1px solid var(--color-border-light)">
        <div style="min-width:180px"><strong>${escapeHtml(role.name)}</strong></div>
        <select class="role-day-map-select" data-role-id="${role.id}" style="max-width:240px">
          <option value="">No day assigned</option>
          ${dateOptions}
        </select>
      </div>
    `;
  }).join('');

  return `
    <div class="card" style="margin-bottom:var(--space-md);padding:var(--space-md)">
      <h2 style="margin-top:0">Role Day Mapping</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-sm)">
        Assign each role to an audition day. Then auto-assign students by their #1 role preference.
      </p>
      <div id="role-day-mapping-list">${rows}</div>
      <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm);flex-wrap:wrap">
        <button class="btn-small" id="save-role-day-mappings-btn">Save Role Days</button>
        <button class="btn-accent" id="auto-assign-role-days-btn">Auto-Assign by #1 Role</button>
      </div>
    </div>
  `;
}

function renderFilterBar() {
  const roleOptions = roles.map((r) =>
    `<option value="${r.id}" ${filterRoleId === r.id ? 'selected' : ''}>${escapeHtml(r.name)}</option>`
  ).join('');

  return `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center;margin-bottom:var(--space-md)">
      <label for="filter-role" style="font-size:var(--text-small);font-weight:600">Filter by #1 role:</label>
      <select id="filter-role" style="max-width:200px">
        <option value="">All Students</option>
        ${roleOptions}
        <option value="__none__" ${filterRoleId === '__none__' ? 'selected' : ''}>No Preference</option>
      </select>
    </div>
  `;
}

function getFilteredStudents() {
  if (!filterRoleId) return students;

  const groups = groupStudentsByTopRole(students, roles);
  const group = groups.get(filterRoleId);
  return group ? group.students : [];
}

function renderStudentTable(auditionDates) {
  const filtered = getFilteredStudents();

  const dateOptions = auditionDates.map((d) =>
    `<option value="${d}">${formatDate(d)}</option>`
  ).join('');

  const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));

  let html = `
    <h2>Students (${filtered.length})</h2>
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th class="checkbox-cell"><input type="checkbox" id="select-all-cb" ${allSelected ? 'checked' : ''} /></th>
          <th>Name</th>
          <th>Grade</th>
          <th>#1 Role</th>
          <th>All Preferences</th>
          <th>Assigned Day</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  filtered.forEach((s) => {
    const prefs = sortPreferencesByRank(s.role_preferences || []);
    const topPref = prefs[0];
    const topRole = topPref ? roles.find((r) => r.id === topPref.audition_role_id) : null;
    const allPrefs = prefs.map((p) => {
      const role = roles.find((r) => r.id === p.audition_role_id);
      return `${p.rank_order}. ${escapeHtml(role?.name || '?')}`;
    }).join(', ') || '—';

    const assignment = s.day_assignment;
    const assignedDate = assignment?.audition_date;
    const checked = selectedIds.has(s.id) ? 'checked' : '';

    html += `
      <tr>
        <td class="checkbox-cell"><input type="checkbox" class="student-cb" data-id="${s.id}" ${checked} /></td>
        <td><a href="#/staff/student-profile?id=${s.id}">${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}</a></td>
        <td>${escapeHtml(s.grade || '—')}</td>
        <td>${topRole ? escapeHtml(topRole.name) : '<span style="color:var(--color-text-muted)">—</span>'}</td>
        <td style="font-size:var(--text-xs)">${allPrefs}</td>
        <td>
          ${assignedDate
            ? `<span class="badge active">${formatDate(assignedDate)}</span>`
            : '<span style="color:var(--color-text-muted)">Unassigned</span>'
          }
        </td>
        <td>
          ${assignedDate
            ? `<select class="reassign-select" data-student="${s.id}" style="width:auto;font-size:var(--text-xs)">
                <option value="">— Change —</option>
                ${dateOptions}
              </select>
              <button class="btn-small btn-secondary unassign-btn" data-student="${s.id}" style="margin-left:4px">Remove</button>`
            : `<select class="assign-select" data-student="${s.id}" style="width:auto;font-size:var(--text-xs)">
                <option value="">— Assign —</option>
                ${dateOptions}
              </select>`
          }
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  return html;
}

function renderBulkActionBar(auditionDates) {
  if (selectedIds.size === 0) return '';

  const dateOptions = auditionDates.map((d) =>
    `<option value="${d}">${formatDate(d)}</option>`
  ).join('');

  return `
    <div class="bulk-action-bar">
      <span class="bulk-action-bar__count">${selectedIds.size} selected</span>
      <div class="bulk-action-bar__actions" style="display:flex;align-items:center;gap:var(--space-sm)">
        <select id="bulk-date-select" style="width:auto;font-size:var(--text-xs)">
          <option value="">— Select Date —</option>
          ${dateOptions}
        </select>
        <button class="btn-accent" id="bulk-assign-btn">Assign Selected</button>
      </div>
    </div>
  `;
}

function renderAssignmentSummary(auditionDates) {
  let html = '<h2 style="margin-top:var(--space-xl)">Assignment Summary</h2>';

  const assigned = students.filter((s) => s.day_assignment);
  const unassigned = students.filter((s) => !s.day_assignment);

  html += `<p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
    <strong>${assigned.length}</strong> assigned, <strong>${unassigned.length}</strong> unassigned of <strong>${students.length}</strong> total.
  </p>`;

  html += '<div style="display:grid;gap:var(--space-md);grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">';

  for (const date of auditionDates) {
    const dateStudents = assigned.filter((s) => s.day_assignment?.audition_date === date);
    html += `
      <div class="card" style="padding:var(--space-md)">
        <strong>${formatDate(date)}</strong>
        <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin:var(--space-xs) 0">${dateStudents.length} student${dateStudents.length !== 1 ? 's' : ''}</p>
        ${dateStudents.length > 0
          ? `<ul style="margin:0;padding-left:1rem;font-size:var(--text-xs)">${dateStudents.map((s) => `<li>${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}</li>`).join('')}</ul>`
          : '<p style="font-size:var(--text-xs);color:var(--color-text-muted)">No students assigned</p>'
        }
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function renderNotificationSection() {
  const assigned = students.filter((s) => s.day_assignment);
  const withEmail = assigned.filter((s) => validateNotificationRecipient(s).valid);

  return `
    <div style="margin-top:var(--space-xl)">
      <h2>Send Notifications</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Send day assignment emails to all assigned families with a parent email on file.
        <strong>${withEmail.length}</strong> of <strong>${assigned.length}</strong> assigned students have email.
        <span style="color:var(--color-text-muted)">(Real email delivery via Resend)</span>
      </p>
      <button class="btn-primary" id="send-notifications-btn" ${withEmail.length === 0 ? 'disabled' : ''}>
        Send All Notifications (${withEmail.length})
      </button>
    </div>
  `;
}

function renderNotificationHistory() {
  // Filter to day assignment notifications only
  const dayHistory = history.filter((h) => h.subject && h.subject.includes('Vocal Audition Day'));

  let html = '<h2 style="margin-top:var(--space-xl)">Notification History</h2>';

  if (dayHistory.length === 0) {
    html += '<p style="font-size:var(--text-small);color:var(--color-text-muted)">No day assignment notifications sent yet.</p>';
    return html;
  }

  html += `
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Date Sent</th>
          <th>Student</th>
          <th>Recipient</th>
          <th>Subject</th>
        </tr>
      </thead>
      <tbody>
  `;

  dayHistory.forEach((h) => {
    const st = h.students;
    const date = new Date(h.created_at).toLocaleString();
    html += `
      <tr>
        <td style="font-size:var(--text-xs)">${escapeHtml(date)}</td>
        <td>${escapeHtml(st?.first_name || '')} ${escapeHtml(st?.last_name || '')}</td>
        <td>${escapeHtml(h.recipient_email)}</td>
        <td>${escapeHtml(h.subject)}</td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  return html;
}

function bindContentEvents(contentEl, auditionDates) {
  // Role-day mapping selects (initialize current values)
  contentEl.querySelectorAll('.role-day-map-select').forEach((sel) => {
    const roleId = sel.dataset.roleId;
    sel.value = getMappedDateForRole(roleId);
  });

  const saveMappingsBtn = document.getElementById('save-role-day-mappings-btn');
  if (saveMappingsBtn) {
    saveMappingsBtn.addEventListener('click', async () => {
      const { user } = getAuthState();
      const msgEl = document.getElementById('assign-msg');
      if (!user) return;

      saveMappingsBtn.disabled = true;
      saveMappingsBtn.textContent = 'Saving…';

      const operations = [...document.querySelectorAll('.role-day-map-select')].map(async (sel) => {
        const roleId = sel.dataset.roleId;
        const date = sel.value;
        if (date) return upsertRoleDayMapping(roleId, date, user.id);
        return deleteRoleDayMapping(roleId);
      });

      const results = await Promise.allSettled(operations);
      const errors = [];
      results.forEach((result) => {
        if (result.status === 'rejected') {
          errors.push(result.reason);
          return;
        }
        if (result.value?.error) {
          errors.push(result.value.error);
        }
      });
      const failed = errors.length;
      const firstError = errors[0];

      saveMappingsBtn.disabled = false;
      saveMappingsBtn.textContent = 'Save Role Days';

      if (msgEl) {
        if (failed === 0) {
          msgEl.className = 'form-message success';
          msgEl.textContent = 'Role day mappings saved.';
        } else {
          msgEl.className = 'form-message error';
          msgEl.textContent = firstError?.message
            ? `Failed to save role day mappings: ${firstError.message}`
            : `Saved with ${failed} error(s).`;
        }
      }

      await loadAndRender();
    });
  }

  const autoAssignBtn = document.getElementById('auto-assign-role-days-btn');
  if (autoAssignBtn) {
    autoAssignBtn.addEventListener('click', async () => {
      const msgEl = document.getElementById('assign-msg');
      const roleToDate = new Map(roleDayMappings.map((mapping) => [mapping.audition_role_id, mapping.audition_date]));

      if (roleToDate.size === 0) {
        if (msgEl) {
          msgEl.className = 'form-message error';
          msgEl.textContent = 'Set at least one role day mapping first.';
        }
        return;
      }

      autoAssignBtn.disabled = true;
      autoAssignBtn.textContent = 'Assigning…';

      let assigned = 0;
      let skipped = 0;
      let failed = 0;

      for (const student of students) {
        const prefs = sortPreferencesByRank(student.role_preferences || []);
        const topRoleId = prefs[0]?.audition_role_id;
        const mappedDate = topRoleId ? roleToDate.get(topRoleId) : null;
        if (!mappedDate) {
          skipped++;
          continue;
        }

        const { error } = await assignVocalDay(student.id, mappedDate);
        if (error) failed++;
        else assigned++;
      }

      autoAssignBtn.disabled = false;
      autoAssignBtn.textContent = 'Auto-Assign by #1 Role';

      if (msgEl) {
        if (failed === 0) {
          msgEl.className = 'form-message success';
          msgEl.textContent = `Auto-assigned ${assigned} student(s). Skipped ${skipped}.`;
        } else {
          msgEl.className = 'form-message error';
          msgEl.textContent = `Assigned ${assigned}, skipped ${skipped}, failed ${failed}.`;
        }
      }

      await loadAndRender();
    });
  }

  // Filter dropdown
  const filterSelect = document.getElementById('filter-role');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      filterRoleId = filterSelect.value;
      selectedIds.clear();
      renderContent();
    });
  }

  // Select all checkbox
  const selectAllCb = document.getElementById('select-all-cb');
  if (selectAllCb) {
    selectAllCb.addEventListener('change', () => {
      const filtered = getFilteredStudents();
      if (selectAllCb.checked) {
        filtered.forEach((s) => selectedIds.add(s.id));
      } else {
        filtered.forEach((s) => selectedIds.delete(s.id));
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

  // Individual assign selects
  contentEl.querySelectorAll('.assign-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const studentId = sel.dataset.student;
      const date = sel.value;
      if (!date) return;

      const msgEl = document.getElementById('assign-msg');
      sel.disabled = true;

      const { error } = await assignVocalDay(studentId, date);
      if (error) {
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Assignment failed.'; }
        sel.disabled = false;
        sel.value = '';
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Student assigned.'; }
      await loadAndRender();
    });
  });

  // Individual reassign selects
  contentEl.querySelectorAll('.reassign-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const studentId = sel.dataset.student;
      const date = sel.value;
      if (!date) return;

      const msgEl = document.getElementById('assign-msg');
      sel.disabled = true;

      const { error } = await assignVocalDay(studentId, date);
      if (error) {
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Reassignment failed.'; }
        sel.disabled = false;
        sel.value = '';
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Student reassigned.'; }
      await loadAndRender();
    });
  });

  // Unassign buttons
  contentEl.querySelectorAll('.unassign-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.student;
      if (!window.confirm('Remove this student\'s day assignment?')) return;

      const msgEl = document.getElementById('assign-msg');
      btn.disabled = true;
      btn.textContent = 'Removing…';

      const { error } = await unassignVocalDay(studentId);
      if (error) {
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to remove.'; }
        btn.disabled = false;
        btn.textContent = 'Remove';
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Assignment removed.'; }
      await loadAndRender();
    });
  });

  // Bulk assign
  const bulkAssignBtn = document.getElementById('bulk-assign-btn');
  if (bulkAssignBtn) {
    bulkAssignBtn.addEventListener('click', async () => {
      const dateSelect = document.getElementById('bulk-date-select');
      const date = dateSelect?.value;
      if (!date) {
        const msgEl = document.getElementById('assign-msg');
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = 'Please select a date first.'; }
        return;
      }

      const msgEl = document.getElementById('assign-msg');
      bulkAssignBtn.disabled = true;
      bulkAssignBtn.textContent = 'Assigning…';

      const results = await Promise.allSettled(
        [...selectedIds].map((studentId) => assignVocalDay(studentId, date)),
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled' && !r.value.error).length;
      const failed = results.length - succeeded;

      selectedIds.clear();

      if (msgEl) {
        if (failed === 0) {
          msgEl.className = 'form-message success';
          msgEl.textContent = `Assigned ${succeeded} student(s) to ${formatDate(date)}.`;
        } else {
          msgEl.className = 'form-message error';
          msgEl.textContent = `Assigned ${succeeded}, failed ${failed}. Check console.`;
        }
      }

      await loadAndRender();
    });
  }

  // Send notifications
  const sendBtn = document.getElementById('send-notifications-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const msgEl = document.getElementById('assign-msg');
      const assigned = students.filter((s) => s.day_assignment);
      const withEmail = assigned.filter((s) => validateNotificationRecipient(s).valid);

      if (withEmail.length === 0) {
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = 'No assigned students with email.'; }
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const results = await Promise.allSettled(
        withEmail.map(async (student) => {
          const { subject, body, bodyPreview } = generateDayAssignmentNotificationContent(
            student, student.day_assignment.audition_date, configs,
          );
          const { error: sendError } = await sendNotificationEmail({
            to: student.parent_email,
            subject,
            text: body,
          });
          if (sendError) throw sendError;
          const { error } = await logDayAssignmentNotification(
            student.id, student.parent_email, subject, bodyPreview,
          );
          if (error) throw error;
          return student.id;
        }),
      );

      const sent = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      sendBtn.disabled = false;
      sendBtn.textContent = `Send All Notifications (${withEmail.length})`;

      if (msgEl) {
        if (failed === 0) {
          msgEl.className = 'form-message success';
          msgEl.textContent = `Sent ${sent} notification(s) successfully.`;
        } else {
          msgEl.className = 'form-message error';
          msgEl.textContent = `Sent ${sent}, failed ${failed}. Check console.`;
        }
      }

      const { data: newHistory } = await fetchNotificationHistory();
      history = newHistory || [];
      renderContent();
    });
  }
}
