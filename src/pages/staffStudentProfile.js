import { getAuthState } from '../auth.js';
import { escapeHtml } from '../ui/escapeHtml.js';
import { formatTime, formatDate } from '../domain/scheduling.js';
import { assembleProfileSummary, validateEvaluationInput } from '../domain/studentProfile.js';
import { getQueryParams } from '../router.js';
import { fetchStudentForStaff } from '../adapters/students.js';
import { getSignedPhotoUrl } from '../adapters/storage.js';
import { fetchDanceWindowsFromConfig } from '../adapters/danceSessions.js';
import { fetchVocalBookingForStudent } from '../adapters/vocalBookings.js';
import {
  fetchEvaluationsForStudent,
  createEvaluation,
  updateEvaluation,
} from '../adapters/evaluations.js';

let profile = null;
let photoUrl = null;
let editingEvalId = null;
let evalFlash = null;

export function renderStaffStudentProfile() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Student Profile</h1>
      <button class="btn-ghost" onclick="history.back()" style="min-height:auto;width:auto">← Back</button>
    </div>
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
    fetchDanceWindowsFromConfig(),
    fetchVocalBookingForStudent(studentId),
    fetchEvaluationsForStudent(studentId),
  ]);

  if (studentResult.error || !studentResult.data) {
    showError(studentResult.error?.message || 'Student not found.');
    return;
  }

  profile = assembleProfileSummary(
    studentResult.data,
    { dance_windows: danceResult.data || [] },
    vocalResult.data,
    evalsResult.data || [],
  );

  photoUrl = null;
  if (profile.student.photo_storage_path) {
    const { url } = await getSignedPhotoUrl(profile.student.photo_storage_path);
    photoUrl = url;
  }

  editingEvalId = null;
  evalFlash = null;
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
  const regBadge = s.registration_complete
    ? '<span class="status-badge--complete">✓ Complete</span>'
    : '<span class="status-badge--pending">⏳ Incomplete</span>';

  let html = '';

  // Header card with photo
  html += '<div class="card" style="margin-bottom:var(--space-lg)">';
  html += '<div style="display:flex;gap:var(--space-lg);align-items:flex-start;flex-wrap:wrap">';
  if (photoUrl) {
    html += `<img src="${escapeHtml(photoUrl)}" alt="Student photo" style="width:120px;height:120px;object-fit:cover;border-radius:var(--radius-md);border:2px solid var(--color-border-light)" />`;
  } else {
    html += `<div class="avatar avatar--lg" style="width:120px;height:120px;font-size:2rem">${(s.first_name || '?')[0]}${(s.last_name || '?')[0]}</div>`;
  }
  html += '<div style="flex:1">';
  html += `<h2 style="margin:0 0 var(--space-xs)">${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}</h2>`;
  html += `<p style="margin:0 0 var(--space-xs);font-size:var(--text-small)">Grade ${escapeHtml(s.grade || '—')}</p>`;
  if (s.student_email) {
    html += `<p style="margin:0 0 var(--space-xs);font-size:var(--text-small)"><strong>Student Email:</strong> ${escapeHtml(s.student_email)}</p>`;
  }
  html += `<div style="display:flex;flex-wrap:wrap;gap:var(--space-xs);margin-bottom:var(--space-xs)">${regBadge}`;
  html += profile.callbackInvited ? ' <span class="status-badge--complete">⭐ Callback Invited</span>' : '';
  html += '</div>';
  html += '</div></div>';

  // Parent info section
  html += `<div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--color-border-light)">`;
  html += '<h3 style="font-size:var(--text-small);font-family:var(--font-body);text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);margin-bottom:var(--space-sm)">Parent / Guardian</h3>';
  html += `<p style="font-size:var(--text-small)">${escapeHtml(s.parent_first_name || '')} ${escapeHtml(s.parent_last_name || '')}</p>`;
  html += `<p style="font-size:var(--text-small)"><strong>Email:</strong> ${escapeHtml(s.parent_email || '—')}</p>`;
  html += `<p style="font-size:var(--text-small)"><strong>Phone:</strong> ${escapeHtml(s.parent_phone || '—')}</p>`;
  html += '</div>';

  // Parent 2 section (only if any parent2 fields populated)
  if (s.parent2_first_name || s.parent2_last_name || s.parent2_email || s.parent2_phone) {
    html += `<div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--color-border-light)">`;
    html += '<h3 style="font-size:var(--text-small);font-family:var(--font-body);text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);margin-bottom:var(--space-sm)">Parent / Guardian 2</h3>';
    html += `<p style="font-size:var(--text-small)">${escapeHtml(s.parent2_first_name || '')} ${escapeHtml(s.parent2_last_name || '')}</p>`;
    html += `<p style="font-size:var(--text-small)"><strong>Email:</strong> ${escapeHtml(s.parent2_email || '—')}</p>`;
    html += `<p style="font-size:var(--text-small)"><strong>Phone:</strong> ${escapeHtml(s.parent2_phone || '—')}</p>`;
    html += '</div>';
  }

  // Song info
  if (s.sings_own_disney_song) {
    html += `<div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--color-border-light)">`;
    html += `<span class="status-badge--complete">Own Disney Song: ${escapeHtml(s.song_name || '—')}</span>`;
    html += '</div>';
  }

  html += '</div>';

  // Participation card
  html += '<div class="card" style="margin-bottom:var(--space-lg)">';
  html += '<h3 style="margin-bottom:var(--space-md)">Participation</h3>';
  html += renderParticipation();
  html += '</div>';

  // Evaluations card
  html += '<div class="card">';
  html += '<h3 style="margin-bottom:var(--space-md)">Evaluation Notes</h3>';
  html += renderEvaluations();
  html += renderEvaluationForm();
  html += '</div>';

  contentEl.innerHTML = html;
  bindProfileEvents(contentEl);
}

function renderParticipation() {
  let html = '<table class="data-table"><thead><tr><th>Track</th><th>Status</th><th>Details</th></tr></thead><tbody>';

  if (profile.dance?.dance_windows?.length) {
    const windowsText = profile.dance.dance_windows
      .map((window) => `${formatDate(window.audition_date)} ${formatTime(window.start_time)} – ${formatTime(window.end_time)}`)
      .join('; ');
    html += `<tr><td>🎵 Dance</td><td style="color:var(--color-success)">Assigned</td><td>${escapeHtml(windowsText)}</td></tr>`;
  } else {
    html += '<tr><td>🎵 Dance</td><td style="color:var(--color-text-muted)">Not configured</td><td>—</td></tr>';
  }

  if (profile.vocal && profile.vocal.audition_slots) {
    const vs = profile.vocal.audition_slots;
    html += `<tr><td>🎤 Vocal</td><td style="color:var(--color-success)">Booked</td><td>${formatDate(vs.audition_date)} ${formatTime(vs.start_time)} – ${formatTime(vs.end_time)}</td></tr>`;
  } else {
    html += '<tr><td>🎤 Vocal</td><td style="color:var(--color-text-muted)">Not booked</td><td>—</td></tr>';
  }

  html += `<tr><td>⭐ Callbacks</td><td>${profile.callbackInvited ? '<span style="color:var(--color-success)">Invited</span>' : '<span style="color:var(--color-text-muted)">Not invited</span>'}</td><td>—</td></tr>`;

  html += '</tbody></table>';
  return html;
}

function renderEvaluations() {
  if (profile.evaluations.length === 0) {
    return '<p style="font-size:var(--text-small);color:var(--color-text-muted);margin-bottom:var(--space-md)">No evaluation notes yet.</p>';
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
      <td style="font-size:var(--text-xs)">${escapeHtml(date)}</td>
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
    <div style="margin-top:var(--space-lg);max-width:500px">
      <h4>${isEditing ? 'Edit Note' : 'Add Note'}</h4>
      <div class="login-form" style="max-width:100%">
        <label for="eval-track">Track</label>
        <select id="eval-track" ${isEditing ? 'disabled' : ''}>
          <option value="general" ${(!editingEval || editingEval.track === 'general') ? 'selected' : ''}>General</option>
          <option value="dance" ${editingEval?.track === 'dance' ? 'selected' : ''}>Dance</option>
          <option value="vocal" ${editingEval?.track === 'vocal' ? 'selected' : ''}>Vocal</option>
          <option value="callbacks" ${editingEval?.track === 'callbacks' ? 'selected' : ''}>Callbacks</option>
        </select>
        <label for="eval-notes">Notes</label>
        <textarea id="eval-notes" rows="3">${editingEval ? escapeHtml(editingEval.notes) : ''}</textarea>
        <div style="display:flex;gap:var(--space-sm)">
          <button id="eval-submit-btn" class="btn-accent">${isEditing ? 'Update Note' : 'Add Note'}</button>
          ${isEditing ? '<button id="eval-cancel-btn" class="btn-ghost">Cancel</button>' : ''}
        </div>
        <div class="form-message${evalFlash?.type ? ` ${evalFlash.type}` : ''}" id="eval-msg" aria-live="polite">${evalFlash?.text || ''}</div>
      </div>
    </div>
  `;
}

function bindProfileEvents(contentEl) {
  contentEl.querySelectorAll('.edit-eval-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingEvalId = btn.dataset.id;
      renderProfile();
    });
  });

  const cancelBtn = document.getElementById('eval-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editingEvalId = null;
      renderProfile();
    });
  }

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
      evalFlash = null;
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

      evalFlash = {
        type: 'success',
        text: editingEvalId ? 'Note updated.' : 'Note added.',
      };

      editingEvalId = null;

      const { data: newEvals } = await fetchEvaluationsForStudent(profile.student.id);
      profile.evaluations = newEvals || [];
      renderProfile();
    });
  }
}
