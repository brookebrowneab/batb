import { getAuthState } from '../auth.js';
import { escapeHtml } from '../ui/escapeHtml.js';
import { formatTime } from '../domain/scheduling.js';
import { assembleProfileSummary, validateEvaluationInput } from '../domain/studentProfile.js';
import { getQueryParams } from '../router.js';
import { fetchStudentForStaff } from '../adapters/students.js';
import { getSignedPhotoUrl } from '../adapters/storage.js';
import { fetchDanceSignupForStudent } from '../adapters/danceSessions.js';
import { fetchVocalBookingForStudent } from '../adapters/vocalBookings.js';
import {
  fetchEvaluationsForStudent,
  createEvaluation,
  updateEvaluation,
} from '../adapters/evaluations.js';

let profile = null;
let photoUrl = null;
let editingEvalId = null;

export function renderStaffStudentProfile() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Student Profile</h1>
    <p><a href="#/staff">&larr; Back to Staff Dashboard</a></p>
    <div class="form-message" id="profile-msg" aria-live="polite"></div>
    <div id="profile-content"><p>Loading…</p></div>
  `;

  setTimeout(() => loadProfile(), 0);
  return container;
}

async function loadProfile() {
  const params = getQueryParams();
  const studentId = params.id;

  if (!studentId) {
    showError('No student ID provided. Use a link from a roster page.');
    return;
  }

  const [studentResult, danceResult, vocalResult, evalsResult] = await Promise.all([
    fetchStudentForStaff(studentId),
    fetchDanceSignupForStudent(studentId),
    fetchVocalBookingForStudent(studentId),
    fetchEvaluationsForStudent(studentId),
  ]);

  if (studentResult.error || !studentResult.data) {
    showError(studentResult.error?.message || 'Student not found.');
    return;
  }

  profile = assembleProfileSummary(
    studentResult.data,
    danceResult.data,
    vocalResult.data,
    evalsResult.data || [],
  );

  // Fetch photo signed URL if photo exists
  photoUrl = null;
  if (profile.student.photo_storage_path) {
    const { url } = await getSignedPhotoUrl(profile.student.photo_storage_path);
    photoUrl = url;
  }

  editingEvalId = null;
  renderProfile();
}

function showError(message) {
  const contentEl = document.getElementById('profile-content');
  if (contentEl) {
    contentEl.innerHTML = `<div class="placeholder-notice">${escapeHtml(message)}</div>`;
  }
}

function renderProfile() {
  const contentEl = document.getElementById('profile-content');
  if (!contentEl || !profile || !profile.student) return;

  const s = profile.student;
  const regStatus = s.registration_complete ? 'Complete' : 'Incomplete';
  const regColor = s.registration_complete ? '#28a745' : '#dc3545';

  let html = '';

  // Photo + Header section
  html += '<div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;margin-bottom:1.5rem">';
  if (photoUrl) {
    html += `<img src="${escapeHtml(photoUrl)}" alt="Student photo" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #dee2e6" />`;
  } else {
    html += '<div style="width:120px;height:120px;background:#e9ecef;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#6c757d;font-size:0.75rem">No photo</div>';
  }
  html += '<div>';
  html += `<h2 style="margin:0 0 0.25rem 0">${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}</h2>`;
  html += `<p style="margin:0 0 0.25rem 0"><strong>Grade:</strong> ${escapeHtml(s.grade || '—')}</p>`;
  html += `<p style="margin:0 0 0.25rem 0"><strong>Registration:</strong> <span style="color:${regColor}">${regStatus}</span></p>`;
  html += `<p style="margin:0"><strong>Callback Invited:</strong> ${profile.callbackInvited ? '<span style="color:#28a745">Yes</span>' : 'No'}</p>`;
  html += '</div></div>';

  // Parent info
  html += '<h3>Parent / Guardian</h3>';
  html += `<p>${escapeHtml(s.parent_first_name || '')} ${escapeHtml(s.parent_last_name || '')}</p>`;
  html += `<p><strong>Email:</strong> ${escapeHtml(s.parent_email || '—')}</p>`;
  html += `<p><strong>Phone:</strong> ${escapeHtml(s.parent_phone || '—')}</p>`;

  // Participation
  html += '<h3 style="margin-top:1.5rem">Participation</h3>';
  html += renderParticipation();

  // Evaluations
  html += '<h3 style="margin-top:1.5rem">Evaluation Notes</h3>';
  html += renderEvaluations();
  html += renderEvaluationForm();

  contentEl.innerHTML = html;
  bindProfileEvents(contentEl);
}

function renderParticipation() {
  let html = '<table class="data-table"><thead><tr><th>Track</th><th>Status</th><th>Details</th></tr></thead><tbody>';

  // Dance
  if (profile.dance && profile.dance.dance_sessions) {
    const ds = profile.dance.dance_sessions;
    html += `<tr><td>Dance</td><td style="color:#28a745">Signed Up</td><td>${escapeHtml(ds.audition_date || '')} ${formatTime(ds.start_time)} – ${formatTime(ds.end_time)}${ds.label ? ' (' + escapeHtml(ds.label) + ')' : ''}</td></tr>`;
  } else {
    html += '<tr><td>Dance</td><td style="color:#6c757d">Not signed up</td><td>—</td></tr>';
  }

  // Vocal
  if (profile.vocal && profile.vocal.audition_slots) {
    const vs = profile.vocal.audition_slots;
    html += `<tr><td>Vocal</td><td style="color:#28a745">Booked</td><td>${escapeHtml(vs.audition_date || '')} ${formatTime(vs.start_time)} – ${formatTime(vs.end_time)}</td></tr>`;
  } else {
    html += '<tr><td>Vocal</td><td style="color:#6c757d">Not booked</td><td>—</td></tr>';
  }

  // Callbacks
  html += `<tr><td>Callbacks</td><td>${profile.callbackInvited ? '<span style="color:#28a745">Invited</span>' : '<span style="color:#6c757d">Not invited</span>'}</td><td>—</td></tr>`;

  html += '</tbody></table>';
  return html;
}

function renderEvaluations() {
  if (profile.evaluations.length === 0) {
    return '<p style="font-size:0.875rem;color:#6c757d">No evaluation notes yet.</p>';
  }

  const { user } = getAuthState();

  let html = '<table class="data-table"><thead><tr><th>Track</th><th>Notes</th><th>By</th><th>Date</th><th>Actions</th></tr></thead><tbody>';

  profile.evaluations.forEach((ev) => {
    const staffName = ev.staff_profiles?.display_name || 'Unknown';
    const date = new Date(ev.created_at).toLocaleString();
    const isOwn = ev.staff_user_id === user?.id;

    html += `<tr>
      <td>${escapeHtml(ev.track)}</td>
      <td>${escapeHtml(ev.notes)}</td>
      <td>${escapeHtml(staffName)}</td>
      <td>${escapeHtml(date)}</td>
      <td>${isOwn ? `<button class="btn-small edit-eval-btn" data-id="${ev.id}" data-notes="${escapeHtml(ev.notes)}" data-track="${escapeHtml(ev.track)}">Edit</button>` : ''}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  return html;
}

function renderEvaluationForm() {
  const isEditing = editingEvalId !== null;
  const editingEval = isEditing ? profile.evaluations.find((e) => e.id === editingEvalId) : null;

  return `
    <div style="margin-top:1rem;max-width:500px">
      <h4>${isEditing ? 'Edit Note' : 'Add Note'}</h4>
      <label for="eval-track">Track</label>
      <select id="eval-track" style="padding:0.5rem;border:1px solid #ced4da;border-radius:4px;width:100%;margin-bottom:0.5rem" ${isEditing ? 'disabled' : ''}>
        <option value="general" ${(!editingEval || editingEval.track === 'general') ? 'selected' : ''}>General</option>
        <option value="dance" ${editingEval?.track === 'dance' ? 'selected' : ''}>Dance</option>
        <option value="vocal" ${editingEval?.track === 'vocal' ? 'selected' : ''}>Vocal</option>
        <option value="callbacks" ${editingEval?.track === 'callbacks' ? 'selected' : ''}>Callbacks</option>
      </select>
      <label for="eval-notes">Notes</label>
      <textarea id="eval-notes" rows="3" style="padding:0.5rem;border:1px solid #ced4da;border-radius:4px;width:100%;margin-bottom:0.5rem;font-family:inherit">${editingEval ? escapeHtml(editingEval.notes) : ''}</textarea>
      <button id="eval-submit-btn">${isEditing ? 'Update Note' : 'Add Note'}</button>
      ${isEditing ? '<button id="eval-cancel-btn" class="btn-small btn-secondary" style="margin-left:0.5rem">Cancel</button>' : ''}
      <div class="form-message" id="eval-msg" aria-live="polite"></div>
    </div>
  `;
}

function bindProfileEvents(contentEl) {
  // Edit evaluation buttons
  contentEl.querySelectorAll('.edit-eval-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingEvalId = btn.dataset.id;
      renderProfile();
    });
  });

  // Cancel edit button
  const cancelBtn = document.getElementById('eval-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editingEvalId = null;
      renderProfile();
    });
  }

  // Submit evaluation
  const submitBtn = document.getElementById('eval-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const track = document.getElementById('eval-track')?.value;
      const notes = document.getElementById('eval-notes')?.value?.trim();
      const msgEl = document.getElementById('eval-msg');

      const validation = validateEvaluationInput(notes, track);
      if (!validation.valid) {
        if (msgEl) {
          msgEl.className = 'form-message error';
          msgEl.textContent = validation.errors.join(' ');
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = editingEvalId ? 'Updating…' : 'Adding…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      let error;
      if (editingEvalId) {
        ({ error } = await updateEvaluation(editingEvalId, notes));
      } else {
        const { user } = getAuthState();
        ({ error } = await createEvaluation(profile.student.id, user.id, track, notes));
      }

      if (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = editingEvalId ? 'Update Note' : 'Add Note';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to save note.'; }
        return;
      }

      if (msgEl) {
        msgEl.className = 'form-message success';
        msgEl.textContent = editingEvalId ? 'Note updated.' : 'Note added.';
      }

      editingEvalId = null;

      // Reload evaluations
      const { data: newEvals } = await fetchEvaluationsForStudent(profile.student.id);
      profile.evaluations = newEvals || [];
      renderProfile();
    });
  }
}
