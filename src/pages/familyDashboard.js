import { getAuthState } from '../auth.js';
import { fetchStudentsByFamily } from '../adapters/students.js';
import { fetchActiveContract, fetchAcceptancesForStudent } from '../adapters/contracts.js';
import { fetchDanceSignupForStudent } from '../adapters/danceSessions.js';
import { fetchVocalBookingForStudent } from '../adapters/vocalBookings.js';
import { evaluateRegistration } from '../domain/registration.js';
import { formatTime, formatDate } from '../domain/scheduling.js';
import { escapeHtml } from '../ui/escapeHtml.js';

async function loadRegistrationStatus(userId) {
  const [studentsResult, contractResult] = await Promise.all([
    fetchStudentsByFamily(userId),
    fetchActiveContract(),
  ]);

  const students = studentsResult.data || [];
  const activeContract = contractResult.data;
  const activeContractId = activeContract?.id || null;

  const studentsWithStatus = await Promise.all(
    students.map(async (student) => {
      const [
        { data: acceptances },
        { data: danceSignup },
        { data: vocalBooking },
      ] = await Promise.all([
        fetchAcceptancesForStudent(student.id),
        fetchDanceSignupForStudent(student.id),
        fetchVocalBookingForStudent(student.id),
      ]);
      const status = evaluateRegistration(student, acceptances || [], activeContractId);
      return { ...student, registrationStatus: status, danceSignup, vocalBooking };
    }),
  );

  return { students: studentsWithStatus, activeContract };
}

function renderAuditionTimes(student) {
  const { danceSignup, vocalBooking } = student;

  let danceText = 'Not signed up';
  if (danceSignup && danceSignup.dance_sessions) {
    const s = danceSignup.dance_sessions;
    danceText = `${formatDate(s.audition_date)} ${formatTime(s.start_time)} – ${formatTime(s.end_time)}`;
  }

  let vocalText = 'Not booked';
  if (vocalBooking && vocalBooking.audition_slots) {
    const s = vocalBooking.audition_slots;
    vocalText = `${formatDate(s.audition_date)} ${formatTime(s.start_time)} – ${formatTime(s.end_time)}`;
  }

  return `
    <div style="margin-top:0.5rem; font-size:0.875rem">
      <strong>Audition Times</strong>
      <ul style="margin:0.25rem 0 0 1.25rem; padding:0">
        <li>Dance: ${escapeHtml(danceText)}</li>
        <li>Vocal: ${escapeHtml(vocalText)}</li>
      </ul>
    </div>
  `;
}

function renderNextSteps(student) {
  const { registrationStatus, danceSignup, vocalBooking } = student;

  if (!registrationStatus.complete) {
    return `<p style="margin-top:0.5rem"><a href="#/family/register">Complete registration &rarr;</a></p>`;
  }

  const steps = [];
  if (!danceSignup) steps.push('<a href="#/family/dance">Sign up for dance &rarr;</a>');
  if (!vocalBooking) steps.push('<a href="#/family/vocal">Book a vocal slot &rarr;</a>');

  if (steps.length === 0) return '';
  return `<p style="margin-top:0.5rem;font-size:0.875rem"><strong>Next:</strong> ${steps.join(' | ')}</p>`;
}

function renderStudentCard(student) {
  const { registrationStatus } = student;
  const statusClass = registrationStatus.complete ? 'success-box' : 'warning-box';
  const statusLabel = registrationStatus.complete ? 'Registration Complete' : 'Registration Incomplete';

  return `
    <div class="student-card ${statusClass}">
      <h3>${escapeHtml(student.first_name || 'Unnamed')} ${escapeHtml(student.last_name || 'Student')}</h3>
      <p class="status-label"><strong>${statusLabel}</strong></p>
      ${
        registrationStatus.complete
          ? ''
          : `
            <p>Missing:</p>
            <ul>${registrationStatus.missing.map((m) => `<li>${m}</li>`).join('')}</ul>
          `
      }
      ${student.callback_invited ? '<p style="color:#28a745"><strong>Invited to Callbacks</strong></p>' : ''}
      ${renderAuditionTimes(student)}
      ${renderNextSteps(student)}
    </div>
  `;
}

export function renderFamilyDashboard() {
  const { user } = getAuthState();
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Family Dashboard</h1>
    <p>Welcome, ${escapeHtml(user?.email || 'family member')}.</p>
    <h2>Actions</h2>
    <nav class="home-actions">
      <a href="#/family/register">Register Student</a>
      <a href="#/family/contract">View & Sign Contract</a>
      <a href="#/family/schedule">Audition Schedule</a>
      <a href="#/family/dance">Dance Sign-Up</a>
      <a href="#/family/vocal">Vocal Booking</a>
    </nav>
    <h2>Your Students</h2>
    <div id="students-list"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    if (!user) return;
    const { students } = await loadRegistrationStatus(user.id);
    const listEl = document.getElementById('students-list');
    if (!listEl) return;

    if (students.length === 0) {
      listEl.innerHTML = '<p>No students registered yet. <a href="#/family/register">Start registration</a>.</p>';
    } else {
      listEl.innerHTML = students.map(renderStudentCard).join('');
    }
  }, 0);

  return container;
}
