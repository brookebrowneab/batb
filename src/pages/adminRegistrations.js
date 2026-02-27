import { escapeHtml } from '../ui/escapeHtml.js';
import { deleteStudent, fetchRegistrationsForAdmin } from '../adapters/students.js';
import { fetchAuditionRoles } from '../adapters/rolePreferences.js';
import { sortPreferencesByRank } from '../domain/rolePreferences.js';

let allStudents = [];
let allRoles = [];
let filterGrade = '';
let filterRoleId = '';

export function renderAdminRegistrations() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Student Registrations</h1>
      <button class="btn-ghost" onclick="location.hash='#/admin'" style="min-height:auto;width:auto">← Admin Dashboard</button>
    </div>
    <div class="form-message" id="registrations-msg" aria-live="polite"></div>
    <div id="registrations-content"><p>Loading…</p></div>
  `;

  setTimeout(() => loadAndRender(), 0);
  return container;
}

async function loadAndRender() {
  const [studentsResult, rolesResult] = await Promise.all([
    fetchRegistrationsForAdmin(),
    fetchAuditionRoles(),
  ]);

  if (studentsResult.error) {
    renderError(studentsResult.error.message || 'Failed to load students.');
    return;
  }

  allStudents = studentsResult.data || [];
  allRoles = rolesResult.data || [];
  renderContent();
}

function renderError(message) {
  const contentEl = document.getElementById('registrations-content');
  if (contentEl) {
    contentEl.innerHTML = `<div class="placeholder-notice">${escapeHtml(message)}</div>`;
  }
}

function getTopRoleId(student) {
  const sorted = sortPreferencesByRank(student.role_preferences || []);
  return sorted[0]?.audition_role_id || '';
}

function getRoleName(roleId) {
  if (!roleId) return '';
  return allRoles.find((role) => role.id === roleId)?.name || '';
}

function getFilteredStudents() {
  return allStudents.filter((student) => {
    if (filterGrade && String(student.grade || '') !== filterGrade) return false;
    if (filterRoleId) {
      if (filterRoleId === '__none__') return !getTopRoleId(student);
      return getTopRoleId(student) === filterRoleId;
    }
    return true;
  });
}

function renderFilters() {
  const grades = [...new Set(allStudents.map((s) => String(s.grade || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const gradeOptions = grades.map((grade) =>
    `<option value="${escapeHtml(grade)}" ${filterGrade === grade ? 'selected' : ''}>${escapeHtml(grade)}</option>`
  ).join('');

  const roleOptions = allRoles.map((role) =>
    `<option value="${role.id}" ${filterRoleId === role.id ? 'selected' : ''}>${escapeHtml(role.name)}</option>`
  ).join('');

  return `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:flex-end;margin-bottom:var(--space-md)">
      <div>
        <label for="registration-filter-grade" style="font-size:var(--text-small);font-weight:600">Grade</label>
        <select id="registration-filter-grade" style="min-width:140px">
          <option value="">All Grades</option>
          ${gradeOptions}
        </select>
      </div>
      <div>
        <label for="registration-filter-role" style="font-size:var(--text-small);font-weight:600">Role (#1 Preference)</label>
        <select id="registration-filter-role" style="min-width:220px">
          <option value="">All Roles</option>
          ${roleOptions}
          <option value="__none__" ${filterRoleId === '__none__' ? 'selected' : ''}>No Preference</option>
        </select>
      </div>
      <button id="registration-clear-filters" class="btn-small btn-secondary">Clear Filters</button>
    </div>
  `;
}

function renderTable(students) {
  if (students.length === 0) {
    return '<div class="placeholder-notice">No students match the selected filters.</div>';
  }

  const rows = students.map((student) => {
    const name = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const topRoleName = getRoleName(getTopRoleId(student));
    return `
      <tr>
        <td>
          <a href="#/staff/student-profile?id=${student.id}" data-registration-student-link="${student.id}">
            ${escapeHtml(name || 'Unnamed Student')}
          </a>
        </td>
        <td>${escapeHtml(student.grade || '—')}</td>
        <td>${topRoleName ? escapeHtml(topRoleName) : '<span style="color:var(--color-text-muted)">—</span>'}</td>
        <td>${student.registration_complete ? '<span class="status-badge--complete">Complete</span>' : '<span class="status-badge--pending">Incomplete</span>'}</td>
        <td>${student.callback_invited ? '⭐' : '—'}</td>
        <td><button class="btn-small btn-secondary delete-registration-btn" data-student-id="${student.id}">Delete</button></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Grade</th>
            <th>#1 Role</th>
            <th>Registration</th>
            <th>Callback</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function bindEvents() {
  const gradeSelect = document.getElementById('registration-filter-grade');
  if (gradeSelect) {
    gradeSelect.addEventListener('change', () => {
      filterGrade = gradeSelect.value;
      renderContent();
    });
  }

  const roleSelect = document.getElementById('registration-filter-role');
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      filterRoleId = roleSelect.value;
      renderContent();
    });
  }

  const clearBtn = document.getElementById('registration-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filterGrade = '';
      filterRoleId = '';
      renderContent();
    });
  }

  document.querySelectorAll('.delete-registration-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.getAttribute('data-student-id');
      const student = allStudents.find((s) => s.id === studentId);
      const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'this student';
      if (!studentId) return;
      if (!window.confirm(`Delete registration for ${studentName}? This permanently removes the student and related records.`)) return;

      btn.disabled = true;
      btn.textContent = 'Deleting…';
      const msgEl = document.getElementById('registrations-msg');

      const { error } = await deleteStudent(studentId);
      if (error) {
        btn.disabled = false;
        btn.textContent = 'Delete';
        if (msgEl) {
          msgEl.className = 'form-message error';
          msgEl.textContent = error.message || 'Failed to delete registration.';
        }
        return;
      }

      allStudents = allStudents.filter((student) => student.id !== studentId);
      if (msgEl) {
        msgEl.className = 'form-message success';
        msgEl.textContent = `Deleted registration for ${studentName}.`;
      }
      renderContent();
    });
  });
}

function renderContent() {
  const contentEl = document.getElementById('registrations-content');
  if (!contentEl) return;

  const filtered = getFilteredStudents();
  contentEl.innerHTML = `
    ${renderFilters()}
    <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
      Showing <strong>${filtered.length}</strong> of <strong>${allStudents.length}</strong> students.
    </p>
    ${renderTable(filtered)}
  `;
  bindEvents();
}
