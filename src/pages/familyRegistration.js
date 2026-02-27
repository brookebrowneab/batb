import { getAuthState } from '../auth.js';
import { fetchStudentsByFamily, createStudent, updateStudent, deleteStudent } from '../adapters/students.js';
import { fetchActiveContract, fetchAcceptancesForStudent, submitAcceptance } from '../adapters/contracts.js';
import { uploadPhoto, getSignedPhotoUrl } from '../adapters/storage.js';
import { generatePhotoPath } from '../adapters/storage.js';
import { validateAcceptanceInput } from '../domain/contracts.js';
import { hasAcceptedContract } from '../domain/contracts.js';
import { evaluateRegistration, validateSongChoice } from '../domain/registration.js';
import { isBlockedEmailDomain } from '../domain/emailValidation.js';
import { escapeHtml } from '../ui/escapeHtml.js';
import { renderContractText } from '../ui/sanitizeHtml.js';
import { fetchAuditionSettings, fetchAuditionRoles, fetchRolePreferencesForStudent, saveRolePreferences } from '../adapters/rolePreferences.js';
import { isDayAssignmentMode, sortPreferencesByRank, validateRolePreferences } from '../domain/rolePreferences.js';
import { sendRegistrationScheduleEmail } from '../adapters/notifications.js';

/**
 * 6-step wizard registration flow.
 * Steps: 1) Student Info → 2) Parent Info → 3) Audition Song → 4) Photo → [5) Roles] → 6) Review & Contract
 */

let allStudents = [];
let currentStudent = null;
let currentAcceptances = [];
let activeContract = null;
let wizardStep = 1;
let auditionSettings = null;
let auditionRoles = [];
let studentPreferences = [];

function getSelectedStudentIdFromHash() {
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return null;
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  const studentId = params.get('studentId');
  return studentId || null;
}

function hasRoleStep() {
  return auditionRoles.length > 0 && isDayAssignmentMode(auditionSettings);
}

function getStepNames() {
  const steps = ['Student Info', 'Parent/Guardian', 'Audition Song', 'Photo'];
  if (hasRoleStep()) steps.push('Role Preferences');
  steps.push('Review & Sign');
  return steps;
}

async function loadData(userId, selectedStudentId = null, forceNewStudent = false) {
  const [studentsResult, contractResult, settingsResult, rolesResult] = await Promise.all([
    fetchStudentsByFamily(userId),
    fetchActiveContract(),
    fetchAuditionSettings(),
    fetchAuditionRoles(),
  ]);

  allStudents = studentsResult.data || [];
  activeContract = contractResult.data;
  auditionSettings = settingsResult.data;
  auditionRoles = rolesResult.data || [];

  if (forceNewStudent) {
    currentStudent = null;
  } else if (selectedStudentId) {
    currentStudent = allStudents.find((s) => s.id === selectedStudentId) || null;
  } else if (allStudents.length > 0) {
    currentStudent = allStudents[0];
  } else {
    currentStudent = null;
  }

  if (currentStudent) {
    const [acceptancesResult, prefsResult] = await Promise.all([
      fetchAcceptancesForStudent(currentStudent.id),
      hasRoleStep() ? fetchRolePreferencesForStudent(currentStudent.id) : { data: [] },
    ]);
    currentAcceptances = acceptancesResult.data || [];
    studentPreferences = prefsResult.data || [];
  } else {
    currentAcceptances = [];
    studentPreferences = [];
  }
}

function renderWizardProgress() {
  const stepNames = getStepNames();
  let html = '<div class="wizard-progress">';
  for (let i = 1; i <= stepNames.length; i++) {
    if (i > 1) {
      html += `<div class="wizard-progress__connector${i <= wizardStep ? ' wizard-progress__connector--complete' : ''}"></div>`;
    }
    let dotClass = 'wizard-progress__dot';
    let dotContent = String(i);
    if (i < wizardStep) { dotClass += ' wizard-progress__dot--complete'; dotContent = '✓'; }
    else if (i === wizardStep) { dotClass += ' wizard-progress__dot--active'; }
    const labelClass = i === wizardStep ? 'wizard-progress__label wizard-progress__label--active' : 'wizard-progress__label';
    html += `<div class="wizard-progress__step"><div class="${dotClass}">${dotContent}</div><span class="${labelClass}">${stepNames[i - 1]}</span></div>`;
  }
  html += '</div>';
  return html;
}

function renderStudentSelector() {
  let html = '';
  if (allStudents.length > 1) {
    const options = allStudents.map((s) => {
      const selected = currentStudent && s.id === currentStudent.id ? 'selected' : '';
      return `<option value="${s.id}" ${selected}>${escapeHtml(s.first_name || 'Unnamed')} ${escapeHtml(s.last_name || 'Student')}</option>`;
    }).join('');
    html += `<div class="student-selector"><label for="student-select"><strong>Student:</strong></label><select id="student-select">${options}</select></div>`;
  }
  if (allStudents.length >= 1) {
    html += `
      <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:var(--space-md)">
        <button id="add-student-btn" class="btn-small">+ Add Another Student</button>
        ${currentStudent ? '<button id="clear-registration-btn" class="btn-small btn-secondary">Clear This Registration</button>' : ''}
      </div>
    `;
  }
  return html;
}

function renderChecklist() {
  const status = evaluateRegistration(currentStudent, currentAcceptances, activeContract?.id || null);
  if (status.complete) {
    return `<div class="enchanted-banner" style="margin-bottom:var(--space-md)"><div class="enchanted-banner__icon">🌹</div><div class="enchanted-banner__content"><div class="enchanted-banner__title">Registration Complete!</div><div class="enchanted-banner__message">All requirements are met. Dance and vocal schedules are assigned by staff.</div><a class="enchanted-banner__link" href="#/family/schedule">View schedule →</a></div></div>`;
  }
  return `<div class="warning-box student-card" style="margin-bottom:var(--space-md)"><strong>Registration Incomplete</strong><p style="margin-top:var(--space-xs)">Still needed:</p><ul style="margin:0.25rem 0 0 1.25rem;padding:0">${status.missing.map((m) => `<li>${m}</li>`).join('')}</ul></div>`;
}

function getParentDefaults() {
  if (currentStudent && (currentStudent.parent_first_name || currentStudent.parent_email)) {
    return currentStudent;
  }
  const sibling = allStudents.find((s) => s.parent_first_name || s.parent_email);
  return sibling || currentStudent || {};
}

function renderStep1() {
  const s = currentStudent || {};
  return `
    <div class="card">
      <h2>Student Information</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">Enter the student's basic details.</p>
      <form id="student-form" class="login-form" style="max-width:100%">
        <label for="reg-first-name">First Name *</label>
        <input type="text" id="reg-first-name" required value="${escapeHtml(s.first_name || '')}" />
        <label for="reg-last-name">Last Name *</label>
        <input type="text" id="reg-last-name" required value="${escapeHtml(s.last_name || '')}" />
        <label for="reg-grade">Grade *</label>
        <input type="text" id="reg-grade" required value="${escapeHtml(s.grade || '')}" placeholder="e.g. 5, 6, 7" />
        <label for="reg-student-email">Student Email (optional)</label>
        <input type="email" id="reg-student-email" value="${escapeHtml(s.student_email || '')}" placeholder="student@example.com" />
        <button type="submit" class="btn-accent">${currentStudent ? 'Save & Continue' : 'Save & Continue'}</button>
        <div id="student-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `;
}

function renderStep2() {
  if (!currentStudent) return '<div class="card"><h2>Parent/Guardian Information</h2><p class="placeholder-notice">Complete student info first.</p></div>';
  const s = getParentDefaults();
  return `
    <div class="card">
      <h2>Parent/Guardian Information</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">This information is used for communication and day-of logistics.</p>
      <form id="parent-form" class="login-form" style="max-width:100%">
        <label for="reg-parent-first">First Name *</label>
        <input type="text" id="reg-parent-first" required value="${escapeHtml(s.parent_first_name || '')}" />
        <label for="reg-parent-last">Last Name *</label>
        <input type="text" id="reg-parent-last" required value="${escapeHtml(s.parent_last_name || '')}" />
        <label for="reg-parent-email">Email *</label>
        <input type="email" id="reg-parent-email" required value="${escapeHtml(s.parent_email || '')}" />
        <label for="reg-parent-phone">Phone *</label>
        <input type="tel" id="reg-parent-phone" required value="${escapeHtml(s.parent_phone || '')}" placeholder="(555) 123-4567" />

        <div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--color-border-light)">
          <label style="display:flex;align-items:center;gap:var(--space-sm);cursor:pointer">
            <input type="checkbox" id="reg-show-parent2" ${(s.parent2_first_name || s.parent2_email) ? 'checked' : ''} />
            Add second parent/guardian (optional)
          </label>
        </div>
        <div id="parent2-fields" style="display:${(s.parent2_first_name || s.parent2_email) ? 'block' : 'none'};margin-top:var(--space-sm)">
          <label for="reg-parent2-first">First Name</label>
          <input type="text" id="reg-parent2-first" value="${escapeHtml(s.parent2_first_name || '')}" />
          <label for="reg-parent2-last">Last Name</label>
          <input type="text" id="reg-parent2-last" value="${escapeHtml(s.parent2_last_name || '')}" />
          <label for="reg-parent2-email">Email</label>
          <input type="email" id="reg-parent2-email" value="${escapeHtml(s.parent2_email || '')}" />
          <label for="reg-parent2-phone">Phone</label>
          <input type="tel" id="reg-parent2-phone" value="${escapeHtml(s.parent2_phone || '')}" placeholder="(555) 123-4567" />
        </div>

        <button type="submit" class="btn-accent">Save & Continue</button>
        <div id="parent-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `;
}

function renderStep3Song() {
  if (!currentStudent) return '<div class="card"><h2>Audition Song</h2><p class="placeholder-notice">Complete student info first.</p></div>';
  const s = currentStudent;
  const singsOwn = s.sings_own_disney_song || false;
  return `
    <div class="card">
      <h2>Audition Song</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Will this student sing their own Disney song for the vocal audition?
      </p>
      <form id="song-form" class="login-form" style="max-width:100%">
        <div style="display:flex;gap:var(--space-lg);margin-bottom:var(--space-md)">
          <label style="display:flex;align-items:center;gap:var(--space-xs);cursor:pointer">
            <input type="radio" name="sings-own" value="yes" ${singsOwn ? 'checked' : ''} /> Yes
          </label>
          <label style="display:flex;align-items:center;gap:var(--space-xs);cursor:pointer">
            <input type="radio" name="sings-own" value="no" ${!singsOwn ? 'checked' : ''} /> No
          </label>
        </div>
        <div id="song-name-field" style="display:${singsOwn ? 'block' : 'none'}">
          <label for="reg-song-name">Song Name *</label>
          <input type="text" id="reg-song-name" value="${escapeHtml(s.song_name || '')}" placeholder="e.g. Part of Your World" />
        </div>
        <button type="submit" class="btn-accent">Save & Continue</button>
        <div id="song-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `;
}

function renderStepPhoto() {
  if (!currentStudent) return '<div class="card"><h2>Student Photo</h2><p class="placeholder-notice">Complete student info first.</p></div>';
  const hasExisting = currentStudent.photo_storage_path;
  return `
    <div class="card">
      <h2>Student Photo</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Upload a clear headshot photo of the student. This will be included in staff materials.
      </p>
      ${hasExisting ? '<p class="form-message success" style="margin-bottom:var(--space-sm)">✓ Photo uploaded. You can replace it below.</p>' : ''}
      <div id="photo-preview" style="margin-bottom:var(--space-md)"></div>
      <form id="photo-form" class="login-form" style="max-width:100%">
        <input type="file" id="reg-photo" accept="image/*" ${hasExisting ? '' : 'required'} />
        <button type="submit" class="btn-accent">${hasExisting ? 'Replace & Continue' : 'Upload & Continue'}</button>
        <div id="photo-form-msg" class="form-message" aria-live="polite"></div>
      </form>
      ${hasExisting ? `<button class="btn-ghost skip-step-btn" style="margin-top:var(--space-sm);width:100%">Skip — keep current photo</button>` : ''}
    </div>
  `;
}

function renderStepRolePreferences() {
  if (!currentStudent) return '<div class="card"><h2>Role Preferences</h2><p class="placeholder-notice">Complete student info first.</p></div>';

  const sorted = sortPreferencesByRank(studentPreferences);
  const existingMap = new Map(sorted.map((p) => [p.audition_role_id, p.rank_order]));
  const rankOptions = auditionRoles.map((_, i) => i + 1);

  let rolesHtml = auditionRoles.map((role) => {
    const currentRank = existingMap.get(role.id) || '';
    const options = rankOptions.map((r) =>
      `<option value="${r}" ${currentRank === r ? 'selected' : ''}>${r}</option>`
    ).join('');
    return `
      <div class="role-pref-row" style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border)">
        <div style="flex:1"><strong>${escapeHtml(role.name)}</strong></div>
        <select class="role-rank-select" data-role-id="${role.id}" style="width:80px">
          <option value="">—</option>
          ${options}
        </select>
      </div>
    `;
  }).join('');

  const hasSaved = sorted.length > 0;

  return `
    <div class="card">
      <h2>Role Preferences</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Rank the roles your student would like to audition for. This helps the director assign audition days.
        This step is optional — you can skip it if you're unsure.
      </p>
      ${hasSaved ? '<p class="form-message success" style="margin-bottom:var(--space-sm)">✓ Preferences saved.</p>' : ''}
      <div id="role-prefs-list" style="margin-bottom:var(--space-md)">
        ${rolesHtml}
      </div>
      <button id="save-role-prefs-btn" class="btn-accent" style="width:100%">Save & Continue</button>
      <button id="skip-role-prefs-btn" class="btn-ghost" style="margin-top:var(--space-sm);width:100%">Skip — no preference</button>
      <div id="role-prefs-msg" class="form-message" aria-live="polite"></div>
    </div>
  `;
}

function renderStep4() {
  if (!currentStudent) return '<div class="card"><h2>Review & Sign</h2><p class="placeholder-notice">Complete previous steps first.</p></div>';

  const s = currentStudent;
  const alreadySigned = activeContract && hasAcceptedContract(currentAcceptances, activeContract.id);

  let contractSection = '';
  if (!activeContract) {
    contractSection = '<p class="placeholder-notice" style="margin-top:var(--space-md)">No active contract available.</p>';
  } else if (alreadySigned) {
    const acceptance = currentAcceptances.find((a) => a.contract_id === activeContract.id);
    contractSection = `
      <div class="success-box" style="padding:var(--space-md);border-radius:var(--radius-sm);margin-top:var(--space-lg)">
        <strong>✓ Contract signed!</strong>
        <p style="font-size:var(--text-small)">Student: ${escapeHtml(acceptance.student_typed_signature)}</p>
        <p style="font-size:var(--text-small)">Parent: ${escapeHtml(acceptance.parent_typed_signature)}</p>
        <p style="font-size:var(--text-small);color:var(--color-text-muted)">Signed: ${new Date(acceptance.created_at).toLocaleString()}</p>
      </div>
    `;
  } else {
    contractSection = `
      <div style="margin-top:var(--space-lg)">
        <h3>Contract (v${activeContract.version_number})</h3>
        <div class="contract-text">${renderContractText(activeContract.text_snapshot)}</div>
        <form id="contract-form" class="login-form" style="max-width:100%;margin-top:var(--space-md)">
          <label for="reg-student-sig">Student Typed Signature *</label>
          <input type="text" id="reg-student-sig" required placeholder="Type student's full name" />
          <label for="reg-parent-sig">Parent/Guardian Typed Signature *</label>
          <input type="text" id="reg-parent-sig" required placeholder="Type parent/guardian's full name" />
          <button type="submit" class="btn-accent">Sign & Complete Registration</button>
          <div id="contract-form-msg" class="form-message" aria-live="polite"></div>
        </form>
      </div>
    `;
  }

  return `
    <div class="card">
      <h2>Review & Sign</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">Review your information, then sign the contract to complete registration.</p>

      <div style="display:grid;gap:var(--space-md)">
        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Student Info</strong>
            <button class="link-btn edit-step-btn" data-step="1">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${escapeHtml(s.first_name || '—')} ${escapeHtml(s.last_name || '—')}, Grade ${escapeHtml(s.grade || '—')}</p>
          ${s.student_email ? `<p style="font-size:var(--text-small)">Email: ${escapeHtml(s.student_email)}</p>` : ''}
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Parent/Guardian</strong>
            <button class="link-btn edit-step-btn" data-step="2">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${escapeHtml(s.parent_first_name || '—')} ${escapeHtml(s.parent_last_name || '—')}</p>
          <p style="font-size:var(--text-small)">${escapeHtml(s.parent_email || '—')} | ${escapeHtml(s.parent_phone || '—')}</p>
          ${(s.parent2_first_name || s.parent2_email) ? `
          <p style="font-size:var(--text-small);margin-top:var(--space-xs)"><strong>Parent 2:</strong> ${escapeHtml(s.parent2_first_name || '')} ${escapeHtml(s.parent2_last_name || '')}</p>
          <p style="font-size:var(--text-small)">${escapeHtml(s.parent2_email || '—')} | ${escapeHtml(s.parent2_phone || '—')}</p>
          ` : ''}
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Audition Song</strong>
            <button class="link-btn edit-step-btn" data-step="3">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${s.sings_own_disney_song ? `Own song: ${escapeHtml(s.song_name || '—')}` : 'No own song'}</p>
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Photo</strong>
            <button class="link-btn edit-step-btn" data-step="4">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${s.photo_storage_path ? '✓ Photo uploaded' : '⏳ No photo yet'}</p>
        </div>

        ${hasRoleStep() ? `
        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Role Preferences</strong>
            <button class="link-btn edit-step-btn" data-step="5">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${studentPreferences.length > 0
            ? sortPreferencesByRank(studentPreferences).map((p) => {
                const role = auditionRoles.find((r) => r.id === p.audition_role_id);
                return `${p.rank_order}. ${escapeHtml(role?.name || 'Unknown')}`;
              }).join(', ')
            : '— No preferences set (optional)'
          }</p>
        </div>
        ` : ''}
      </div>

      ${contractSection}
    </div>
  `;
}

async function updateRegistrationComplete(userId) {
  if (!currentStudent) return;
  const status = evaluateRegistration(currentStudent, currentAcceptances, activeContract?.id || null);
  const wasComplete = currentStudent.registration_complete === true;
  if (status.complete !== currentStudent.registration_complete) {
    await updateStudent(currentStudent.id, { registration_complete: status.complete }, userId);
    currentStudent.registration_complete = status.complete;
  }
  if (!wasComplete && status.complete) {
    const { error } = await sendRegistrationScheduleEmail(currentStudent.id);
    if (error) {
      // Do not block registration completion if notification automation fails.
      console.error('Registration schedule email failed:', error.message || error);
    }
  }
}

function bindStudentSelector(userId, refreshFn) {
  const select = document.getElementById('student-select');
  if (select) {
    select.addEventListener('change', () => {
      wizardStep = 1;
      refreshFn(select.value);
    });
  }

  const addBtn = document.getElementById('add-student-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      currentStudent = null;
      currentAcceptances = [];
      wizardStep = 1;
      refreshFn(null, true);
    });
  }

  const clearBtn = document.getElementById('clear-registration-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!currentStudent?.id) return;
      const studentName = `${currentStudent.first_name || ''} ${currentStudent.last_name || ''}`.trim() || 'this student';
      const confirmed = window.confirm(`Clear registration for ${studentName}? This deletes the student record and all related registration data.`);
      if (!confirmed) return;

      clearBtn.disabled = true;
      const { error } = await deleteStudent(currentStudent.id);
      if (error) {
        clearBtn.disabled = false;
        window.alert('Failed to clear registration: ' + error.message);
        return;
      }

      const remaining = allStudents.filter((s) => s.id !== currentStudent.id);
      currentStudent = remaining[0] || null;
      currentAcceptances = [];
      studentPreferences = [];
      wizardStep = 1;
      refreshFn(currentStudent?.id || null, !currentStudent);
    });
  }
}

function bindNavButtons(refreshFn) {
  const backBtn = document.getElementById('wizard-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (wizardStep > 1) { wizardStep--; refreshFn(currentStudent?.id); }
    });
  }

  document.querySelectorAll('.edit-step-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      wizardStep = parseInt(btn.dataset.step, 10);
      refreshFn(currentStudent?.id);
    });
  });

  const skipBtn = document.querySelector('.skip-step-btn');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      wizardStep++;
      refreshFn(currentStudent?.id);
    });
  }
}

async function loadPhotoPreview(path) {
  const previewEl = document.getElementById('photo-preview');
  if (!previewEl || !path) return;
  const { url } = await getSignedPhotoUrl(path);
  if (url) {
    previewEl.innerHTML = `<img src="${url}" alt="Student photo" class="photo-preview" />`;
  }
}

function bindForms(userId, refreshFn) {
  // Student form (step 1)
  const studentForm = document.getElementById('student-form');
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('student-form-msg');
      const btn = studentForm.querySelector('button');
      const fields = {
        firstName: document.getElementById('reg-first-name').value.trim(),
        lastName: document.getElementById('reg-last-name').value.trim(),
        grade: document.getElementById('reg-grade').value.trim(),
      };
      const studentEmail = document.getElementById('reg-student-email')?.value.trim() || '';

      if (!fields.firstName || !fields.lastName || !fields.grade) {
        msg.textContent = 'First name, last name, and grade are required.';
        msg.className = 'form-message error';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Saving…';

      if (currentStudent) {
        const { data, error } = await updateStudent(
          currentStudent.id,
          { first_name: fields.firstName, last_name: fields.lastName, grade: fields.grade, student_email: studentEmail || null },
          userId,
        );
        if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Save & Continue'; return; }
        currentStudent = { ...currentStudent, ...data };
        await updateRegistrationComplete(userId);
        wizardStep = 2;
        refreshFn(currentStudent.id);
      } else {
        const { data, error } = await createStudent({
          familyAccountId: userId,
          firstName: fields.firstName,
          lastName: fields.lastName,
          grade: fields.grade,
          studentEmail: studentEmail || undefined,
          createdByUserId: userId,
        });
        if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Save & Continue'; return; }
        currentStudent = data;
        await updateRegistrationComplete(userId);
        wizardStep = 2;
        refreshFn(currentStudent.id);
      }
    });
  }

  // Parent form (step 2)
  const parentForm = document.getElementById('parent-form');
  if (parentForm) {
    parentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('parent-form-msg');
      const btn = parentForm.querySelector('button');
      const fields = {
        parent_first_name: document.getElementById('reg-parent-first').value.trim(),
        parent_last_name: document.getElementById('reg-parent-last').value.trim(),
        parent_email: document.getElementById('reg-parent-email').value.trim(),
        parent_phone: document.getElementById('reg-parent-phone').value.trim(),
      };

      // Parent 2 optional fields
      const showParent2 = document.getElementById('reg-show-parent2')?.checked;
      if (showParent2) {
        fields.parent2_first_name = document.getElementById('reg-parent2-first')?.value.trim() || null;
        fields.parent2_last_name = document.getElementById('reg-parent2-last')?.value.trim() || null;
        fields.parent2_email = document.getElementById('reg-parent2-email')?.value.trim() || null;
        fields.parent2_phone = document.getElementById('reg-parent2-phone')?.value.trim() || null;
      } else {
        fields.parent2_first_name = null;
        fields.parent2_last_name = null;
        fields.parent2_email = null;
        fields.parent2_phone = null;
      }

      if (!fields.parent_first_name || !fields.parent_last_name || !fields.parent_email || !fields.parent_phone) {
        msg.textContent = 'Parent 1 fields are required.';
        msg.className = 'form-message error';
        return;
      }

      if (isBlockedEmailDomain(fields.parent_email)) {
        msg.textContent = 'Student email addresses cannot be used. Please use a parent or guardian email.';
        msg.className = 'form-message error';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Saving…';

      const { data, error } = await updateStudent(currentStudent.id, fields, userId);
      if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Save & Continue'; return; }
      currentStudent = { ...currentStudent, ...data };
      await updateRegistrationComplete(userId);
      wizardStep = 3;
      refreshFn(currentStudent.id);
    });

    // Toggle parent2 fields visibility
    const showParent2Cb = document.getElementById('reg-show-parent2');
    if (showParent2Cb) {
      showParent2Cb.addEventListener('change', () => {
        const parent2Fields = document.getElementById('parent2-fields');
        if (parent2Fields) parent2Fields.style.display = showParent2Cb.checked ? 'block' : 'none';
      });
    }
  }

  // Song form (step 3 — Audition Song)
  const songForm = document.getElementById('song-form');
  if (songForm) {
    // Toggle song name field visibility
    songForm.querySelectorAll('input[name="sings-own"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const songNameField = document.getElementById('song-name-field');
        if (songNameField) songNameField.style.display = radio.value === 'yes' && radio.checked ? 'block' : 'none';
      });
    });

    songForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('song-form-msg');
      const btn = songForm.querySelector('button[type="submit"]');
      const singsOwn = songForm.querySelector('input[name="sings-own"]:checked')?.value === 'yes';
      const songName = document.getElementById('reg-song-name')?.value.trim() || '';

      const { valid, error: songError } = validateSongChoice(singsOwn, songName);
      if (!valid) {
        msg.textContent = songError;
        msg.className = 'form-message error';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Saving…';

      const updateFields = {
        sings_own_disney_song: singsOwn,
        song_name: singsOwn ? songName : null,
      };

      const { data, error } = await updateStudent(currentStudent.id, updateFields, userId);
      if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Save & Continue'; return; }
      currentStudent = { ...currentStudent, ...data };
      wizardStep = 4;
      refreshFn(currentStudent.id);
    });
  }

  // Photo form (step 4)
  const photoForm = document.getElementById('photo-form');
  if (photoForm) {
    photoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('photo-form-msg');
      const btn = photoForm.querySelector('button');
      const fileInput = document.getElementById('reg-photo');
      const file = fileInput.files[0];

      if (!file) {
        msg.textContent = 'Please select a photo.';
        msg.className = 'form-message error';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Uploading…';
      msg.textContent = '';

      try {
        const path = generatePhotoPath(userId, file.name);
        const { error: uploadError } = await uploadPhoto(path, file);
        if (uploadError) { msg.textContent = 'Upload failed: ' + (uploadError.message || JSON.stringify(uploadError)); msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Upload & Continue'; return; }

        const { data, error: updateError } = await updateStudent(currentStudent.id, { photo_storage_path: path }, userId);
        if (updateError) { msg.textContent = 'Error saving photo reference: ' + (updateError.message || JSON.stringify(updateError)); msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Upload & Continue'; return; }

        currentStudent = { ...currentStudent, ...data };
        await updateRegistrationComplete(userId);
        wizardStep++;
        refreshFn(currentStudent.id);
      } catch (err) {
        msg.textContent = 'Unexpected error: ' + (err.message || String(err));
        msg.className = 'form-message error';
        btn.disabled = false;
        btn.textContent = 'Upload & Continue';
      }
    });

    if (currentStudent?.photo_storage_path) {
      loadPhotoPreview(currentStudent.photo_storage_path);
    }
  }

  // Role preferences step
  const savePrefsBtn = document.getElementById('save-role-prefs-btn');
  if (savePrefsBtn) {
    savePrefsBtn.addEventListener('click', async () => {
      const msg = document.getElementById('role-prefs-msg');
      const selects = document.querySelectorAll('.role-rank-select');
      const preferences = [];

      selects.forEach((sel) => {
        const rank = parseInt(sel.value, 10);
        if (!rank) return; // skip unselected
        preferences.push({ roleId: sel.dataset.roleId, rank });
      });

      const validation = validateRolePreferences(preferences, auditionRoles);
      if (!validation.valid) {
        if (msg) {
          msg.textContent = validation.errors[0] || 'Each rank can only be used once.';
          msg.className = 'form-message error';
        }
        return;
      }

      savePrefsBtn.disabled = true;
      savePrefsBtn.textContent = 'Saving…';
      if (msg) msg.textContent = '';

      const { error } = await saveRolePreferences(currentStudent.id, preferences, userId);

      if (error) {
        if (msg) {
          msg.textContent = 'Error: ' + error.message;
          msg.className = 'form-message error';
        }
        savePrefsBtn.disabled = false;
        savePrefsBtn.textContent = 'Save & Continue';
        return;
      }

      wizardStep++;
      refreshFn(currentStudent.id);
    });
  }

  const skipPrefsBtn = document.getElementById('skip-role-prefs-btn');
  if (skipPrefsBtn) {
    skipPrefsBtn.addEventListener('click', () => {
      wizardStep++;
      refreshFn(currentStudent.id);
    });
  }

  // Contract form (review step)
  const contractForm = document.getElementById('contract-form');
  if (contractForm) {
    contractForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('contract-form-msg');
      const btn = contractForm.querySelector('button');
      const studentSig = document.getElementById('reg-student-sig').value.trim();
      const parentSig = document.getElementById('reg-parent-sig').value.trim();

      const { valid, errors } = validateAcceptanceInput(studentSig, parentSig);
      if (!valid) { msg.textContent = errors.join(' '); msg.className = 'form-message error'; return; }

      btn.disabled = true;
      btn.textContent = 'Signing…';

      const { error } = await submitAcceptance({
        studentId: currentStudent.id,
        contractId: activeContract.id,
        studentTypedSignature: studentSig,
        parentTypedSignature: parentSig,
        signedByUserId: userId,
      });

      if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Sign & Complete Registration'; return; }

      const { data: acceptances } = await fetchAcceptancesForStudent(currentStudent.id);
      currentAcceptances = acceptances || [];
      await updateRegistrationComplete(userId);
      refreshFn(currentStudent.id);
    });
  }
}

export function renderFamilyRegistration() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Student Registration 📋</h1>
    <div id="reg-student-selector"></div>
    <div id="reg-checklist"></div>
    <div id="reg-content"><p>Loading…</p></div>
  `;

  const { user } = getAuthState();
  if (!user) return container;

  const selectedStudentId = getSelectedStudentIdFromHash();

  async function refresh(selectedStudentId, forceNewStudent = false) {
    await loadData(user.id, selectedStudentId, forceNewStudent);
    const selectorEl = document.getElementById('reg-student-selector');
    const checklistEl = document.getElementById('reg-checklist');
    const contentEl = document.getElementById('reg-content');
    if (!contentEl) return;

    if (selectorEl) selectorEl.innerHTML = renderStudentSelector();
    if (checklistEl) checklistEl.innerHTML = currentStudent ? renderChecklist() : '';

    // Render wizard progress + current step (step name-based dispatch)
    const stepNames = getStepNames();
    const currentStepName = stepNames[wizardStep - 1] || stepNames[stepNames.length - 1];
    let stepHtml = '';
    if (currentStepName === 'Student Info') stepHtml = renderStep1();
    else if (currentStepName === 'Parent/Guardian') stepHtml = renderStep2();
    else if (currentStepName === 'Audition Song') stepHtml = renderStep3Song();
    else if (currentStepName === 'Photo') stepHtml = renderStepPhoto();
    else if (currentStepName === 'Role Preferences') stepHtml = renderStepRolePreferences();
    else if (currentStepName === 'Review & Sign') stepHtml = renderStep4();

    const backBtn = wizardStep > 1 ? `<button id="wizard-back-btn" class="btn-ghost" style="margin-bottom:var(--space-md)">← Back</button>` : '';

    contentEl.innerHTML = `
      ${renderWizardProgress()}
      ${backBtn}
      ${stepHtml}
    `;

    bindStudentSelector(user.id, refresh);
    bindNavButtons(refresh);
    bindForms(user.id, refresh);
  }

  setTimeout(() => refresh(selectedStudentId), 0);
  return container;
}
