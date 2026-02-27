import { getAuthState } from '../auth.js';
import { fetchActiveContract, fetchAcceptancesForStudent, submitAcceptance } from '../adapters/contracts.js';
import { fetchStudentsByFamily } from '../adapters/students.js';
import { validateAcceptanceInput, hasAcceptedContract } from '../domain/contracts.js';
import { escapeHtml } from '../ui/escapeHtml.js';

async function loadData(userId) {
  const [contractResult, studentsResult] = await Promise.all([
    fetchActiveContract(),
    fetchStudentsByFamily(userId),
  ]);

  const activeContract = contractResult.data;
  const students = studentsResult.data || [];

  // For each student, load acceptances
  const studentsWithAcceptances = await Promise.all(
    students.map(async (student) => {
      const { data: acceptances } = await fetchAcceptancesForStudent(student.id);
      return { ...student, acceptances: acceptances || [] };
    }),
  );

  return { activeContract, students: studentsWithAcceptances };
}

function renderSigningForm(student, activeContract) {
  const alreadySigned = hasAcceptedContract(student.acceptances, activeContract.id);

  if (alreadySigned) {
    const acceptance = student.acceptances.find((a) => a.contract_id === activeContract.id);
    return `
      <div class="acceptance-status success-box">
        <strong>Contract signed for ${escapeHtml(student.first_name || 'this student')}.</strong>
        <p>Student signature: ${escapeHtml(acceptance.student_typed_signature)}</p>
        <p>Parent signature: ${escapeHtml(acceptance.parent_typed_signature)}</p>
        <p>Signed: ${new Date(acceptance.created_at).toLocaleString()}</p>
      </div>
    `;
  }

  return `
    <form class="signing-form login-form" data-student-id="${student.id}" data-contract-id="${activeContract.id}">
      <h3>Sign for ${escapeHtml(student.first_name || 'Student')} ${escapeHtml(student.last_name || '')}</h3>
      <label for="student-sig-${student.id}">Student Typed Signature</label>
      <input type="text" id="student-sig-${student.id}" required placeholder="Type student's full name" />
      <label for="parent-sig-${student.id}">Parent/Guardian Typed Signature</label>
      <input type="text" id="parent-sig-${student.id}" required placeholder="Type parent/guardian's full name" />
      <button type="submit">Sign Contract</button>
      <div class="form-message" data-msg-student="${student.id}" aria-live="polite"></div>
    </form>
  `;
}

function bindSigningForms(userId) {
  document.querySelectorAll('.signing-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentId = form.getAttribute('data-student-id');
      const contractId = form.getAttribute('data-contract-id');
      const studentSig = document.getElementById(`student-sig-${studentId}`).value.trim();
      const parentSig = document.getElementById(`parent-sig-${studentId}`).value.trim();
      const msg = document.querySelector(`[data-msg-student="${studentId}"]`);
      const btn = form.querySelector('button');

      const { valid, errors } = validateAcceptanceInput(studentSig, parentSig);
      if (!valid) {
        msg.textContent = errors.join(' ');
        msg.className = 'form-message error';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Signing…';
      msg.textContent = '';

      const { error } = await submitAcceptance({
        studentId,
        contractId,
        studentTypedSignature: studentSig,
        parentTypedSignature: parentSig,
        signedByUserId: userId,
      });

      if (error) {
        msg.textContent = 'Failed to sign: ' + error.message;
        msg.className = 'form-message error';
        btn.disabled = false;
        btn.textContent = 'Sign Contract';
        return;
      }

      msg.textContent = 'Contract signed successfully!';
      msg.className = 'form-message success';
      btn.disabled = true;
      btn.textContent = 'Signed';
    });
  });
}

export function renderFamilyContract() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Contract</h1>
    <p><a href="#/family">&larr; Back to Family Dashboard</a></p>
    <div id="contract-content"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    const { user } = getAuthState();
    if (!user) return;

    const { activeContract, students } = await loadData(user.id);
    const contentEl = document.getElementById('contract-content');
    if (!contentEl) return;

    if (!activeContract) {
      contentEl.innerHTML = `
        <div class="placeholder-notice">
          No active contract is available at this time. Please check back later.
        </div>
      `;
      return;
    }

    if (students.length === 0) {
      contentEl.innerHTML = `
        <div class="placeholder-notice">
          No students registered yet. Please complete student registration first.
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <h2>Contract (v${activeContract.version_number})</h2>
      <div class="contract-text">${escapeHtml(activeContract.text_snapshot)}</div>
      <hr>
      <h2>Signatures</h2>
      ${students.map((s) => renderSigningForm(s, activeContract)).join('')}
    `;

    bindSigningForms(user.id);
  }, 0);

  return container;
}
