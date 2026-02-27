import { getAuthState } from '../auth.js';
import { fetchStudentsByFamily } from '../adapters/students.js';
import {
  fetchAllVocalSlots,
  fetchBookingCountsBySlot,
  fetchVocalBookingForStudent,
  bookVocalSlot,
  rescheduleVocalSlot,
  cancelVocalBooking,
} from '../adapters/vocalBookings.js';
import { checkVocalEligibility, isVocalLocked, checkSlotCapacity, VOCAL_SLOT_CAPACITY } from '../domain/vocalBooking.js';
import { formatTime, formatDate, LOCK_TIME_DISPLAY } from '../domain/scheduling.js';
import { escapeHtml } from '../ui/escapeHtml.js';

export function renderFamilyVocalBooking() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Vocal Booking</h1>
    <p><a href="#/family">&larr; Back to Family Dashboard</a></p>
    <div id="vocal-content"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    const { user } = getAuthState();
    if (!user) return;

    const contentEl = document.getElementById('vocal-content');
    if (!contentEl) return;

    const [studentsResult, slotsResult, countsResult] = await Promise.all([
      fetchStudentsByFamily(user.id),
      fetchAllVocalSlots(),
      fetchBookingCountsBySlot(),
    ]);

    const students = studentsResult.data || [];
    const slots = slotsResult.data || [];
    const counts = countsResult.data || {};

    if (students.length === 0) {
      contentEl.innerHTML = '<div class="placeholder-notice">No students registered yet. <a href="#/family/register">Start registration</a>.</div>';
      return;
    }

    if (slots.length === 0) {
      contentEl.innerHTML = '<div class="placeholder-notice">No vocal slots are available yet. Please check back later.</div>';
      return;
    }

    // Load existing bookings for each student
    const bookings = {};
    await Promise.all(
      students.map(async (s) => {
        const { data } = await fetchVocalBookingForStudent(s.id);
        if (data) bookings[s.id] = data;
      }),
    );

    renderStudents(contentEl, students, slots, counts, bookings);
  }, 0);

  return container;
}

function renderStudents(contentEl, students, slots, counts, bookings) {
  const now = new Date();

  const html = students
    .map((student) => {
      const eligibility = checkVocalEligibility(student);
      const currentBooking = bookings[student.id];
      const currentSlot = currentBooking?.audition_slots;
      const locked = currentSlot
        ? isVocalLocked(currentSlot.audition_date, now)
        : false;

      return `
        <div class="student-card" style="background:#fff;border:1px solid #dee2e6;margin-bottom:1rem">
          <h3>${escapeHtml(student.first_name || 'Unnamed')} ${escapeHtml(student.last_name || 'Student')}</h3>
          ${renderStudentStatus(eligibility, currentSlot, locked)}
          ${eligibility.eligible ? renderSlotSelector(student, slots, counts, currentBooking, now) : ''}
          <div class="form-message" id="vocal-msg-${student.id}" aria-live="polite"></div>
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

  bindBookingEvents(contentEl, students, slots, counts, bookings);
}

function renderStudentStatus(eligibility, currentSlot, locked) {
  if (!eligibility.eligible) {
    return `<div class="warning-box" style="margin:0.5rem 0"><p>${eligibility.reason}</p></div>`;
  }
  if (locked) {
    return '<div class="locked-notice">Bookings are locked for this audition date. Contact an admin for changes.</div>';
  }
  if (currentSlot) {
    return `
      <div class="success-box" style="margin:0.5rem 0">
        <p>Booked: <strong>${formatDate(currentSlot.audition_date)}</strong>
        — ${formatTime(currentSlot.start_time)} – ${formatTime(currentSlot.end_time)}</p>
      </div>
    `;
  }
  return '<div class="warning-box" style="margin:0.5rem 0"><p>Not yet booked for a vocal slot.</p></div>';
}

function renderSlotSelector(student, slots, counts, currentBooking, now) {
  const currentSlotId = currentBooking?.audition_slot_id;
  const hasBooking = !!currentBooking;

  // Group slots by date
  const byDate = {};
  slots.forEach((s) => {
    if (!byDate[s.audition_date]) byDate[s.audition_date] = [];
    byDate[s.audition_date].push(s);
  });

  let html = '';
  for (const [date, dateSlots] of Object.entries(byDate)) {
    const locked = isVocalLocked(date, now);
    html += `<h4 style="margin-top:0.75rem">${formatDate(date)}${locked ? ' <span style="color:#dc3545;font-size:0.75rem">(Locked)</span>' : ''}</h4>`;

    dateSlots.forEach((slot) => {
      const count = counts[slot.id] || 0;
      const capacity = checkSlotCapacity(count);
      const isSelected = slot.id === currentSlotId;
      const canSelect = !locked && (capacity.available || isSelected);

      const spotsText = `${capacity.spotsLeft}/${VOCAL_SLOT_CAPACITY} spots left`;
      const cardClass = isSelected ? 'session-card selected' : (canSelect ? 'session-card' : 'session-card full');

      html += `
        <div class="${cardClass}">
          <div class="session-info">
            <strong>${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}</strong>
            <br><span style="font-size:0.8rem;color:#6c757d">${spotsText}</span>
          </div>
          <div class="session-actions">
            ${isSelected
              ? `<button class="btn-small btn-secondary cancel-btn" data-student="${student.id}" ${locked ? 'disabled' : ''}>Cancel</button>`
              : `<button class="btn-small ${hasBooking ? 'reschedule-btn' : 'book-btn'}" data-student="${student.id}" data-slot="${slot.id}" ${canSelect ? '' : 'disabled'}>${hasBooking ? 'Move Here' : 'Book'}</button>`
            }
          </div>
        </div>
      `;
    });
  }

  return html;
}

function bindBookingEvents(contentEl, students, slots, counts, bookings) {
  // Book buttons (new booking)
  contentEl.querySelectorAll('.book-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.student;
      const slotId = btn.dataset.slot;
      const msgEl = document.getElementById(`vocal-msg-${studentId}`);

      btn.disabled = true;
      btn.textContent = 'Booking…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const { error } = await bookVocalSlot(studentId, slotId);

      if (error) {
        btn.disabled = false;
        btn.textContent = 'Book';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to book slot.'; }
        return;
      }

      await refreshAndRender(contentEl, students, slots, bookings);
    });
  });

  // Reschedule buttons (move existing booking)
  contentEl.querySelectorAll('.reschedule-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.student;
      const slotId = btn.dataset.slot;
      const msgEl = document.getElementById(`vocal-msg-${studentId}`);

      btn.disabled = true;
      btn.textContent = 'Moving…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const { error } = await rescheduleVocalSlot(studentId, slotId);

      if (error) {
        btn.disabled = false;
        btn.textContent = 'Move Here';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to reschedule.'; }
        return;
      }

      await refreshAndRender(contentEl, students, slots, bookings);
    });
  });

  // Cancel buttons
  contentEl.querySelectorAll('.cancel-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!window.confirm('Cancel this vocal booking? You may lose your spot.')) return;
      const studentId = btn.dataset.student;
      const msgEl = document.getElementById(`vocal-msg-${studentId}`);

      btn.disabled = true;
      btn.textContent = 'Cancelling…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const { error } = await cancelVocalBooking(studentId);

      if (error) {
        btn.disabled = false;
        btn.textContent = 'Cancel';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to cancel.'; }
        return;
      }

      delete bookings[studentId];
      await refreshAndRender(contentEl, students, slots, bookings);
    });
  });
}

async function refreshAndRender(contentEl, students, slots, bookings) {
  // Reload bookings and counts
  await Promise.all(
    students.map(async (s) => {
      const { data } = await fetchVocalBookingForStudent(s.id);
      if (data) bookings[s.id] = data;
      else delete bookings[s.id];
    }),
  );
  const { data: newCounts } = await fetchBookingCountsBySlot();
  renderStudents(contentEl, students, slots, newCounts || {}, bookings);
}
