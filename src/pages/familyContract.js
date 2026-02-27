import { getAuthState } from '../auth.js';
import { fetchActiveContract, fetchAcceptancesForStudent, submitAcceptance } from '../adapters/contracts.js';
import { fetchStudentsByFamily } from '../adapters/students.js';
import { validateAcceptanceInput, hasAcceptedContract } from '../domain/contracts.js';
import { escapeHtml } from '../ui/escapeHtml.js';
import { renderContractText } from '../ui/sanitizeHtml.js';

async function loadData(userId) {
  const [contractResult, studentsResult] = await Promise.all([
    fetchActiveContract(),
    fetchStudentsByFamily(userId),
  ]);

  const activeContract = contractResult.data;
  const students = studentsResult.data || [];

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
      <div class="card" style="margin-bottom:var(--space-md);border-left:4px solid var(--color-success)">
        <div class="acceptance-status success-box" style="margin:0">
          <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
            <span class="status-badge--complete">✓ Signed</span>
            <strong>${escapeHtml(student.first_name || 'this student')}</strong>
          </div>
          <p style="font-size:var(--text-small);color:var(--color-text-secondary)">Student: ${escapeHtml(acceptance.student_typed_signature)}</p>
          <p style="font-size:var(--text-small);color:var(--color-text-secondary)">Parent: ${escapeHtml(acceptance.parent_typed_signature)}</p>
          <p style="font-size:var(--text-small);color:var(--color-text-muted)">Signed: ${new Date(acceptance.created_at).toLocaleString()}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card" style="margin-bottom:var(--space-md)">
      <form class="signing-form login-form" data-student-id="${student.id}" data-contract-id="${activeContract.id}" style="margin:0;padding:0;border:none;max-width:100%">
        <h3 style="margin-bottom:var(--space-md)">Sign for ${escapeHtml(student.first_name || 'Student')} ${escapeHtml(student.last_name || '')}</h3>
        <label>
          <input type="checkbox" class="agree-checkbox" style="margin-right:var(--space-sm)" />
          I have read and agree to the terms above
        </label>
        <label for="student-sig-${student.id}">Student Typed Signature</label>
        <input type="text" id="student-sig-${student.id}" required placeholder="Type student's full name" disabled />
        <label for="parent-sig-${student.id}">Parent/Guardian Typed Signature</label>
        <input type="text" id="parent-sig-${student.id}" required placeholder="Type parent/guardian's full name" disabled />
        <button type="submit" class="btn-accent" disabled>Sign & Complete</button>
        <div class="form-message" data-msg-student="${student.id}" aria-live="polite"></div>
      </form>
    </div>
  `;
}

function bindSigningForms(userId) {
  // Checkbox enables/disables inputs and button
  document.querySelectorAll('.agree-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const form = checkbox.closest('.signing-form');
      const inputs = form.querySelectorAll('input[type="text"]');
      const btn = form.querySelector('button[type="submit"]');
      inputs.forEach((input) => { input.disabled = !checkbox.checked; });
      // Enable button only when checkbox is checked and both fields filled
      function updateBtn() {
        const allFilled = Array.from(inputs).every((i) => i.value.trim());
        btn.disabled = !(checkbox.checked && allFilled);
      }
      updateBtn();
      inputs.forEach((input) => input.addEventListener('input', updateBtn));
    });
  });

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
        btn.textContent = 'Sign & Complete';
        return;
      }

      msg.textContent = 'Contract signed successfully! 🌹';
      msg.className = 'form-message success';
      btn.disabled = true;
      btn.textContent = 'Signed ✓';
    });
  });
}

export function renderFamilyContract() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Contract 📋</h1>
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
          No students registered yet. Please <a href="#/family/register">complete student registration</a> first.
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <h2>Contract (v${activeContract.version_number})</h2>
      <div class="contract-text">${renderContractText(activeContract.text_snapshot)}</div>
      <hr>
      <h2>Signatures</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Please read the contract above, then sign for each student below.
      </p>
      ${students.map((s) => renderSigningForm(s, activeContract)).join('')}
    `;

    bindSigningForms(user.id);
  }, 0);

  return container;
}
