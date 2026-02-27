import { getAuthState } from '../auth.js';
import { fetchStudentsByFamily } from '../adapters/students.js';
import { fetchActiveContract, fetchAcceptancesForStudent } from '../adapters/contracts.js';
import { fetchAllConfigs } from '../adapters/scheduling.js';
import { fetchVocalBookingForStudent } from '../adapters/vocalBookings.js';
import { fetchAuditionSettings, fetchVocalDayAssignmentForStudent } from '../adapters/rolePreferences.js';
import { isDayAssignmentMode } from '../domain/rolePreferences.js';
import { evaluateRegistration } from '../domain/registration.js';
import { formatTime, formatDate } from '../domain/scheduling.js';
import { escapeHtml } from '../ui/escapeHtml.js';

async function loadRegistrationStatus(userId) {
  const [studentsResult, contractResult, configsResult, settingsResult] = await Promise.all([
    fetchStudentsByFamily(userId),
    fetchActiveContract(),
    fetchAllConfigs(),
    fetchAuditionSettings(),
  ]);

  const students = studentsResult.data || [];
  const activeContract = contractResult.data;
  const activeContractId = activeContract?.id || null;
  const configs = configsResult.data || [];
  const dayMode = isDayAssignmentMode(settingsResult.data);
  const danceWindows = configs.filter((c) => c.dance_start_time && c.dance_end_time);

  const studentsWithStatus = await Promise.all(
    students.map(async (student) => {
      const [
        { data: acceptances },
        { data: vocalBooking },
        { data: vocalDayAssignment },
      ] = await Promise.all([
        fetchAcceptancesForStudent(student.id),
        dayMode ? Promise.resolve({ data: null }) : fetchVocalBookingForStudent(student.id),
        dayMode ? fetchVocalDayAssignmentForStudent(student.id) : Promise.resolve({ data: null }),
      ]);
      const status = evaluateRegistration(student, acceptances || [], activeContractId);
      return {
        ...student,
        registrationStatus: status,
        danceWindows,
        hasDanceAssigned: danceWindows.length > 0,
        vocalBooking,
        vocalDayAssignment,
      };
    }),
  );

  return { students: studentsWithStatus, activeContract, dayMode };
}

function getWhatsNext(students, activeContract, dayMode) {
  if (students.length === 0) {
    return { icon: '🌹', title: 'Get started!', message: "You haven't registered any students yet.", href: '#/family/register' };
  }
  const incomplete = students.find((s) => !s.registrationStatus.complete);
  if (incomplete) {
    const missing = incomplete.registrationStatus.missing;
    if (missing.some((m) => m.includes('Contract'))) {
      return { icon: '📋', title: 'Contract unsigned', message: `${escapeHtml(incomplete.first_name)} needs a signed contract.`, href: '#/family/contract' };
    }
    return { icon: '⏳', title: 'Registration incomplete', message: `${escapeHtml(incomplete.first_name)} still needs: ${missing.join(', ')}.`, href: '#/family/register' };
  }

  const noDance = students.find((s) => !s.hasDanceAssigned);
  if (noDance) {
    return { icon: '🎵', title: 'Dance schedule pending', message: `${escapeHtml(noDance.first_name)} is waiting on assigned dance day/time.`, href: '#/family/dance' };
  }

  const noVocal = dayMode
    ? students.find((s) => !s.vocalDayAssignment)
    : students.find((s) => !s.vocalBooking);
  if (noVocal) {
    return dayMode
      ? { icon: '🎤', title: 'Vocal day pending', message: `${escapeHtml(noVocal.first_name)} is waiting on a role-based vocal day assignment.`, href: '#/family/vocal' }
      : { icon: '🎤', title: 'Book vocal audition', message: `${escapeHtml(noVocal.first_name)} doesn't have a vocal slot yet.`, href: '#/family/vocal' };
  }
  return { icon: '🌹', title: "You're all set!", message: 'All students are registered and assigned. Break a leg!', href: null };
}

function renderStudentCard(student, dayMode) {
  const { registrationStatus, danceWindows, hasDanceAssigned, vocalBooking, vocalDayAssignment } = student;
  const statusClass = registrationStatus.complete ? 'success-box' : 'warning-box';
  const initials = `${(student.first_name || '?')[0]}${(student.last_name || '?')[0]}`.toUpperCase();

  const regBadge = registrationStatus.complete
    ? '<span class="status-badge--complete">✓ Registered</span>'
    : '<span class="status-badge--pending">⏳ Incomplete</span>';

  const danceBadge = hasDanceAssigned
    ? '<span class="status-badge--complete">✓ Dance</span>'
    : '<span class="status-badge--locked">— Dance</span>';

  const vocalBadge = dayMode
    ? (vocalDayAssignment
        ? '<span class="status-badge--complete">✓ Vocal Day</span>'
        : '<span class="status-badge--locked">— Vocal Day</span>')
    : (vocalBooking
        ? '<span class="status-badge--complete">✓ Vocal</span>'
        : '<span class="status-badge--locked">— Vocal</span>');

  // Audition times
  let danceText = '';
  if (danceWindows && danceWindows.length > 0) {
    const windowLabels = danceWindows
      .map((window) => `${formatDate(window.audition_date)} ${formatTime(window.dance_start_time)} – ${formatTime(window.dance_end_time)}`)
      .join('; ');
    danceText = `🎵 Dance (required): ${windowLabels}`;
  }

  let vocalText = '';
  if (dayMode && vocalDayAssignment) {
    vocalText = `🎤 Vocal Day: ${formatDate(vocalDayAssignment.audition_date)}`;
  } else if (!dayMode && vocalBooking && vocalBooking.audition_slots) {
    const s = vocalBooking.audition_slots;
    vocalText = `🎤 Vocal: ${formatDate(s.audition_date)} ${formatTime(s.start_time)} – ${formatTime(s.end_time)}`;
  }

  // Next step link
  let nextStep = '';
  if (!registrationStatus.complete) {
    nextStep = `<a href="#/family/register" style="font-weight:600;font-size:var(--text-small)">Complete registration →</a>`;
  } else if (!hasDanceAssigned) {
    nextStep = `<a href="#/family/dance" style="font-weight:600;font-size:var(--text-small)">View dance assignment →</a>`;
  } else if ((dayMode && !vocalDayAssignment) || (!dayMode && !vocalBooking)) {
    nextStep = dayMode
      ? `<a href="#/family/vocal" style="font-weight:600;font-size:var(--text-small)">View vocal day assignment →</a>`
      : `<a href="#/family/vocal" style="font-weight:600;font-size:var(--text-small)">Book vocal slot →</a>`;
  }

  const editRegistrationHref = `#/family/register?studentId=${encodeURIComponent(student.id)}`;

  return `
    <div class="student-card ${statusClass}">
      <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm)">
        <div class="avatar">${initials}</div>
        <div>
          <h3 style="margin:0">${escapeHtml(student.first_name || 'Unnamed')} ${escapeHtml(student.last_name || 'Student')}</h3>
          <span style="font-size:var(--text-small);color:var(--color-text-secondary)">Grade ${escapeHtml(student.grade || '—')}</span>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-xs);margin-bottom:var(--space-sm)">
        ${regBadge} ${danceBadge} ${vocalBadge}
      </div>
      ${student.callback_invited ? '<p style="color:var(--color-success);font-weight:600;font-size:var(--text-small)">⭐ Invited to Callbacks</p>' : ''}
      ${danceText ? `<p style="font-size:var(--text-small);color:var(--color-text-secondary)">${escapeHtml(danceText)}</p>` : ''}
      ${vocalText ? `<p style="font-size:var(--text-small);color:var(--color-text-secondary)">${escapeHtml(vocalText)}</p>` : ''}
      ${
        !registrationStatus.complete
          ? `<div style="font-size:var(--text-small);margin-top:var(--space-xs)"><strong>Missing:</strong><ul style="margin:0.25rem 0 0 1.25rem;padding:0">${registrationStatus.missing.map((m) => `<li>${m}</li>`).join('')}</ul></div>`
          : ''
      }
      <div style="margin-top:var(--space-sm)">
        <a
          href="${editRegistrationHref}"
          data-edit-registration="${escapeHtml(student.id)}"
          style="font-weight:600;font-size:var(--text-small)"
        >Edit registration →</a>
      </div>
      ${nextStep ? `<div style="margin-top:var(--space-sm)">${nextStep}</div>` : ''}
    </div>
  `;
}

export function renderFamilyDashboard() {
  const { user } = getAuthState();
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Family Dashboard 🌹</h1>
    <div id="students-list"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    if (!user) return;
    const { students, activeContract, dayMode } = await loadRegistrationStatus(user.id);
    const listEl = document.getElementById('students-list');
    if (!listEl) return;

    // What's Next banner
    const next = getWhatsNext(students, activeContract, dayMode);
    const bannerHtml = `
      <div class="enchanted-banner">
        <div class="enchanted-banner__icon">${next.icon}</div>
        <div class="enchanted-banner__content">
          <div class="enchanted-banner__title">${next.title}</div>
          <div class="enchanted-banner__message">${next.message}</div>
          ${next.href ? `<a class="enchanted-banner__link" href="${next.href}">Get started →</a>` : ''}
        </div>
      </div>
    `;

    if (students.length === 0) {
      listEl.innerHTML = `
        ${bannerHtml}
        <div style="text-align:center;padding:var(--space-2xl) 0;color:var(--color-text-secondary)">
          <div style="font-size:2rem;margin-bottom:var(--space-md)">🌹</div>
          <p>No students registered yet.</p>
          <a href="#/family/register" class="btn-accent" style="margin-top:var(--space-md);display:inline-flex">Register your first student</a>
        </div>
      `;
    } else {
      const quickActions = `
        <div class="quick-actions">
          <a href="#/family/register" class="quick-action">
            <span class="quick-action__icon">📋</span>
            <span class="quick-action__text">Register</span>
          </a>
          <a href="#/family/dance" class="quick-action">
            <span class="quick-action__icon">🎵</span>
            <span class="quick-action__text">Dance Schedule</span>
          </a>
          <a href="#/family/vocal" class="quick-action">
            <span class="quick-action__icon">🎤</span>
            <span class="quick-action__text">Vocal Booking</span>
          </a>
          <a href="#/family/schedule" class="quick-action">
            <span class="quick-action__icon">📅</span>
            <span class="quick-action__text">View Schedule</span>
          </a>
        </div>
      `;
      listEl.innerHTML = `
        ${bannerHtml}
        ${quickActions}
        <h2>Your Students</h2>
        ${students.map((student) => renderStudentCard(student, dayMode)).join('')}
      `;
    }
  }, 0);

  return container;
}
