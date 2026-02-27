import { getAuthState } from '../auth.js';
import { fetchStudentsByFamily } from '../adapters/students.js';
import { fetchAllDanceSessions, fetchSignupCountsBySession, fetchDanceSignupForStudent, upsertDanceSignup, cancelDanceSignup } from '../adapters/danceSessions.js';
import { checkDanceEligibility, isDanceLocked, checkSessionCapacity } from '../domain/danceSignup.js';
import { formatTime, formatDate, LOCK_TIME_DISPLAY } from '../domain/scheduling.js';
import { escapeHtml } from '../ui/escapeHtml.js';

export function renderFamilyDanceSignup() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Dance Sign-Up</h1>
    <p><a href="#/family">&larr; Back to Family Dashboard</a></p>
    <div id="dance-content"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    const { user } = getAuthState();
    if (!user) return;

    const contentEl = document.getElementById('dance-content');
    if (!contentEl) return;

    const [studentsResult, sessionsResult, countsResult] = await Promise.all([
      fetchStudentsByFamily(user.id),
      fetchAllDanceSessions(),
      fetchSignupCountsBySession(),
    ]);

    const students = studentsResult.data || [];
    const sessions = sessionsResult.data || [];
    const counts = countsResult.data || {};

    if (students.length === 0) {
      contentEl.innerHTML = '<div class="placeholder-notice">No students registered yet. <a href="#/family/register">Start registration</a>.</div>';
      return;
    }

    if (sessions.length === 0) {
      contentEl.innerHTML = '<div class="placeholder-notice">No dance sessions are available yet. Please check back later.</div>';
      return;
    }

    // Load existing sign-ups for each student
    const signups = {};
    await Promise.all(
      students.map(async (s) => {
        const { data } = await fetchDanceSignupForStudent(s.id);
        if (data) signups[s.id] = data;
      }),
    );

    renderStudents(contentEl, students, sessions, counts, signups);
  }, 0);

  return container;
}

function renderStudents(contentEl, students, sessions, counts, signups) {
  const now = new Date();

  const html = students
    .map((student) => {
      const eligibility = checkDanceEligibility(student);
      const currentSignup = signups[student.id];
      const currentSession = currentSignup?.dance_sessions;
      const locked = currentSession
        ? isDanceLocked(currentSession.audition_date, now)
        : false;

      return `
        <div class="student-card" style="background:#fff;border:1px solid #dee2e6;margin-bottom:1rem">
          <h3>${escapeHtml(student.first_name || 'Unnamed')} ${escapeHtml(student.last_name || 'Student')}</h3>
          ${renderStudentStatus(eligibility, currentSession, locked)}
          ${eligibility.eligible ? renderSessionSelector(student, sessions, counts, currentSignup, now) : ''}
          <div class="form-message" id="dance-msg-${student.id}" aria-live="polite"></div>
        </div>
      `;
    })
    .join('');

  contentEl.innerHTML = `
    ${html}
    <p class="lock-time-notice" style="margin-top:1rem;font-size:0.875rem;color:#6c757d">
      Changes are locked at <strong>${LOCK_TIME_DISPLAY}</strong>. After that, only an admin can make changes.
    </p>
  `;

  // Bind events
  bindSignupEvents(contentEl, students, sessions, counts, signups);
}

function renderStudentStatus(eligibility, currentSession, locked) {
  if (!eligibility.eligible) {
    return `<div class="warning-box" style="margin:0.5rem 0"><p>${eligibility.reason}</p></div>`;
  }
  if (locked) {
    return `<div class="locked-notice">Sign-ups are locked for this audition date. Contact an admin for changes.</div>`;
  }
  if (currentSession) {
    return `
      <div class="success-box" style="margin:0.5rem 0">
        <p>Signed up for: <strong>${escapeHtml(currentSession.label || formatDate(currentSession.audition_date))}</strong>
        — ${formatTime(currentSession.start_time)} – ${formatTime(currentSession.end_time)}</p>
      </div>
    `;
  }
  return '<div class="warning-box" style="margin:0.5rem 0"><p>Not yet signed up for a dance session.</p></div>';
}

function renderSessionSelector(student, sessions, counts, currentSignup, now) {
  const currentSessionId = currentSignup?.dance_session_id;

  // Group sessions by date
  const byDate = {};
  sessions.forEach((s) => {
    if (!byDate[s.audition_date]) byDate[s.audition_date] = [];
    byDate[s.audition_date].push(s);
  });

  let html = '';
  for (const [date, dateSessions] of Object.entries(byDate)) {
    const locked = isDanceLocked(date, now);
    html += `<h4 style="margin-top:0.75rem">${formatDate(date)}${locked ? ' <span style="color:#dc3545;font-size:0.75rem">(Locked)</span>' : ''}</h4>`;

    dateSessions.forEach((session) => {
      const count = counts[session.id] || 0;
      const capacity = checkSessionCapacity(session, count);
      const isSelected = session.id === currentSessionId;
      const canSelect = !locked && (capacity.available || isSelected);

      const spotsText = capacity.spotsLeft !== null
        ? `${capacity.spotsLeft} spot${capacity.spotsLeft !== 1 ? 's' : ''} left`
        : 'Open';

      const cardClass = isSelected ? 'session-card selected' : (canSelect ? 'session-card' : 'session-card full');

      html += `
        <div class="${cardClass}">
          <div class="session-info">
            <strong>${session.label ? escapeHtml(session.label) : `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`}</strong>
            ${session.label ? `<br><span style="font-size:0.875rem;color:#6c757d">${formatTime(session.start_time)} – ${formatTime(session.end_time)}</span>` : ''}
            <br><span style="font-size:0.8rem;color:#6c757d">${spotsText}</span>
          </div>
          <div class="session-actions">
            ${isSelected
              ? `<button class="btn-small btn-secondary cancel-btn" data-student="${student.id}" ${locked ? 'disabled' : ''}>Cancel</button>`
              : `<button class="btn-small select-btn" data-student="${student.id}" data-session="${session.id}" ${canSelect ? '' : 'disabled'}>${isSelected ? 'Selected' : 'Select'}</button>`
            }
          </div>
        </div>
      `;
    });
  }

  return html;
}

function bindSignupEvents(contentEl, students, sessions, counts, signups) {
  contentEl.querySelectorAll('.select-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.student;
      const sessionId = btn.dataset.session;
      const msgEl = document.getElementById(`dance-msg-${studentId}`);

      btn.disabled = true;
      btn.textContent = 'Saving…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const { error } = await upsertDanceSignup(studentId, sessionId);

      if (error) {
        btn.disabled = false;
        btn.textContent = 'Select';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to sign up.'; }
        return;
      }

      // Refresh the sign-up data and re-render
      const { data: newSignup } = await fetchDanceSignupForStudent(studentId);
      if (newSignup) signups[studentId] = newSignup;
      const { data: newCounts } = await fetchSignupCountsBySession();
      renderStudents(contentEl, students, sessions, newCounts || counts, signups);
    });
  });

  contentEl.querySelectorAll('.cancel-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!window.confirm('Cancel this dance sign-up? You may lose your spot.')) return;
      const studentId = btn.dataset.student;
      const msgEl = document.getElementById(`dance-msg-${studentId}`);

      btn.disabled = true;
      btn.textContent = 'Cancelling…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const { error } = await cancelDanceSignup(studentId);

      if (error) {
        btn.disabled = false;
        btn.textContent = 'Cancel';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to cancel.'; }
        return;
      }

      delete signups[studentId];
      const { data: newCounts } = await fetchSignupCountsBySession();
      renderStudents(contentEl, students, sessions, newCounts || counts, signups);
    });
  });
}
