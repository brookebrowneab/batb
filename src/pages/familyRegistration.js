import { getAuthState } from '../auth.js';
import { fetchStudentsByFamily, createStudent, updateStudent } from '../adapters/students.js';
import { fetchActiveContract, fetchAcceptancesForStudent, submitAcceptance } from '../adapters/contracts.js';
import { uploadPhoto, getSignedPhotoUrl } from '../adapters/storage.js';
import { generatePhotoPath } from '../adapters/storage.js';
import { validateAcceptanceInput } from '../domain/contracts.js';
import { hasAcceptedContract } from '../domain/contracts.js';
import { evaluateRegistration } from '../domain/registration.js';

/**
 * Full registration flow for a single student.
 * Steps: student info → parent info → photo upload → contract signing → done
 */

let currentStudent = null;
let currentAcceptances = [];
let activeContract = null;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadData(userId) {
  const [studentsResult, contractResult] = await Promise.all([
    fetchStudentsByFamily(userId),
    fetchActiveContract(),
  ]);

  const students = studentsResult.data || [];
  activeContract = contractResult.data;

  // For MVP, work with the first student or allow creation
  if (students.length > 0) {
    currentStudent = students[0];
    const { data: acceptances } = await fetchAcceptancesForStudent(currentStudent.id);
    currentAcceptances = acceptances || [];
  } else {
    currentStudent = null;
    currentAcceptances = [];
  }
}

function renderChecklist() {
  const status = evaluateRegistration(currentStudent, currentAcceptances, activeContract?.id || null);

  if (status.complete) {
    return `
      <div class="success-box" style="margin-bottom:1rem">
        <strong>Registration Complete!</strong>
        <p>All requirements are met. Dance and Vocal sign-ups are now available.</p>
      </div>
    `;
  }

  return `
    <div class="warning-box" style="margin-bottom:1rem">
      <strong>Registration Incomplete</strong>
      <p>Still needed:</p>
      <ul>${status.missing.map((m) => `<li>${m}</li>`).join('')}</ul>
    </div>
  `;
}

function renderStudentForm() {
  const s = currentStudent || {};
  return `
    <section class="form-section">
      <h2>1. Student Information</h2>
      <form id="student-form" class="login-form">
        <label for="reg-first-name">First Name *</label>
        <input type="text" id="reg-first-name" required value="${escapeHtml(s.first_name || '')}" />
        <label for="reg-last-name">Last Name *</label>
        <input type="text" id="reg-last-name" required value="${escapeHtml(s.last_name || '')}" />
        <label for="reg-grade">Grade *</label>
        <input type="text" id="reg-grade" required value="${escapeHtml(s.grade || '')}" placeholder="e.g. 5, 6, 7" />
        <button type="submit">${currentStudent ? 'Update Student Info' : 'Save Student Info'}</button>
        <div id="student-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </section>
  `;
}

function renderParentForm() {
  if (!currentStudent) return '<section class="form-section"><h2>2. Parent/Guardian Information</h2><p class="placeholder-notice">Complete student info first.</p></section>';
  const s = currentStudent;
  return `
    <section class="form-section">
      <h2>2. Parent/Guardian Information</h2>
      <form id="parent-form" class="login-form">
        <label for="reg-parent-first">First Name *</label>
        <input type="text" id="reg-parent-first" required value="${escapeHtml(s.parent_first_name || '')}" />
        <label for="reg-parent-last">Last Name *</label>
        <input type="text" id="reg-parent-last" required value="${escapeHtml(s.parent_last_name || '')}" />
        <label for="reg-parent-email">Email *</label>
        <input type="email" id="reg-parent-email" required value="${escapeHtml(s.parent_email || '')}" />
        <label for="reg-parent-phone">Phone *</label>
        <input type="tel" id="reg-parent-phone" required value="${escapeHtml(s.parent_phone || '')}" placeholder="(555) 123-4567" />
        <button type="submit">Update Parent Info</button>
        <div id="parent-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </section>
  `;
}

function renderPhotoUpload() {
  if (!currentStudent) return '<section class="form-section"><h2>3. Student Photo</h2><p class="placeholder-notice">Complete student info first.</p></section>';

  const hasExisting = currentStudent.photo_storage_path;
  return `
    <section class="form-section">
      <h2>3. Student Photo *</h2>
      ${hasExisting ? '<p class="form-message success">Photo uploaded. You can replace it below.</p>' : '<p>Upload a photo of the student (required).</p>'}
      <div id="photo-preview"></div>
      <form id="photo-form" class="login-form">
        <input type="file" id="reg-photo" accept="image/*" ${hasExisting ? '' : 'required'} />
        <button type="submit">Upload Photo</button>
        <div id="photo-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </section>
  `;
}

function renderContractSection() {
  if (!currentStudent) return '<section class="form-section"><h2>4. Contract Signature</h2><p class="placeholder-notice">Complete student info first.</p></section>';
  if (!activeContract) return '<section class="form-section"><h2>4. Contract Signature</h2><p class="placeholder-notice">No active contract available.</p></section>';

  const alreadySigned = hasAcceptedContract(currentAcceptances, activeContract.id);

  if (alreadySigned) {
    const acceptance = currentAcceptances.find((a) => a.contract_id === activeContract.id);
    return `
      <section class="form-section">
        <h2>4. Contract Signature</h2>
        <div class="success-box">
          <strong>Contract signed!</strong>
          <p>Student: ${escapeHtml(acceptance.student_typed_signature)}</p>
          <p>Parent: ${escapeHtml(acceptance.parent_typed_signature)}</p>
          <p>Signed: ${new Date(acceptance.created_at).toLocaleString()}</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="form-section">
      <h2>4. Contract Signature</h2>
      <details>
        <summary>View Contract (v${activeContract.version_number})</summary>
        <div class="contract-text">${escapeHtml(activeContract.text_snapshot)}</div>
      </details>
      <form id="contract-form" class="login-form" style="margin-top:0.75rem">
        <label for="reg-student-sig">Student Typed Signature *</label>
        <input type="text" id="reg-student-sig" required placeholder="Type student's full name" />
        <label for="reg-parent-sig">Parent/Guardian Typed Signature *</label>
        <input type="text" id="reg-parent-sig" required placeholder="Type parent/guardian's full name" />
        <button type="submit">Sign Contract</button>
        <div id="contract-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </section>
  `;
}

async function updateRegistrationComplete(userId) {
  if (!currentStudent) return;
  const status = evaluateRegistration(currentStudent, currentAcceptances, activeContract?.id || null);
  if (status.complete !== currentStudent.registration_complete) {
    await updateStudent(currentStudent.id, { registration_complete: status.complete }, userId);
    currentStudent.registration_complete = status.complete;
  }
}

function bindForms(userId, refreshFn) {
  // Student form
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

      if (!fields.firstName || !fields.lastName || !fields.grade) {
        msg.textContent = 'All fields are required.';
        msg.className = 'form-message error';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Saving…';

      if (currentStudent) {
        const { data, error } = await updateStudent(
          currentStudent.id,
          { first_name: fields.firstName, last_name: fields.lastName, grade: fields.grade },
          userId,
        );
        if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Update Student Info'; return; }
        currentStudent = { ...currentStudent, ...data };
      } else {
        const { data, error } = await createStudent({
          familyAccountId: userId,
          firstName: fields.firstName,
          lastName: fields.lastName,
          grade: fields.grade,
          createdByUserId: userId,
        });
        if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Save Student Info'; return; }
        currentStudent = data;
      }

      await updateRegistrationComplete(userId);
      refreshFn();
    });
  }

  // Parent form
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

      if (!fields.parent_first_name || !fields.parent_last_name || !fields.parent_email || !fields.parent_phone) {
        msg.textContent = 'All fields are required.';
        msg.className = 'form-message error';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Saving…';

      const { data, error } = await updateStudent(currentStudent.id, fields, userId);
      if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Update Parent Info'; return; }
      currentStudent = { ...currentStudent, ...data };
      await updateRegistrationComplete(userId);
      refreshFn();
    });
  }

  // Photo form
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

      const path = generatePhotoPath(userId, file.name);
      const { error: uploadError } = await uploadPhoto(path, file);
      if (uploadError) { msg.textContent = 'Upload failed: ' + uploadError.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Upload Photo'; return; }

      const { data, error: updateError } = await updateStudent(currentStudent.id, { photo_storage_path: path }, userId);
      if (updateError) { msg.textContent = 'Error saving photo reference: ' + updateError.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Upload Photo'; return; }

      currentStudent = { ...currentStudent, ...data };
      await updateRegistrationComplete(userId);
      refreshFn();
    });

    // Load existing photo preview
    if (currentStudent?.photo_storage_path) {
      loadPhotoPreview(currentStudent.photo_storage_path);
    }
  }

  // Contract form
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

      if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'form-message error'; btn.disabled = false; btn.textContent = 'Sign Contract'; return; }

      // Reload acceptances
      const { data: acceptances } = await fetchAcceptancesForStudent(currentStudent.id);
      currentAcceptances = acceptances || [];
      await updateRegistrationComplete(userId);
      refreshFn();
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

export function renderFamilyRegistration() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Student Registration</h1>
    <p><a href="#/family">&larr; Back to Family Dashboard</a></p>
    <div id="reg-checklist"></div>
    <div id="reg-content"><p>Loading…</p></div>
  `;

  const { user } = getAuthState();
  if (!user) return container;

  async function refresh() {
    await loadData(user.id);
    const checklistEl = document.getElementById('reg-checklist');
    const contentEl = document.getElementById('reg-content');
    if (!contentEl) return;

    if (checklistEl) checklistEl.innerHTML = renderChecklist();

    contentEl.innerHTML = `
      ${renderStudentForm()}
      ${renderParentForm()}
      ${renderPhotoUpload()}
      ${renderContractSection()}
    `;
    bindForms(user.id, refresh);
  }

  setTimeout(refresh, 0);
  return container;
}
