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
import { fetchAuditionSettings, fetchVocalDayAssignmentForStudent } from '../adapters/rolePreferences.js';
import { isDayAssignmentMode } from '../domain/rolePreferences.js';

let pendingSelections = {};
let flashMessages = {};

export function renderFamilyVocalBooking() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Vocal Booking 🎤</h1>
    <p style="margin-bottom:var(--space-md)"><a href="#/family/dance" class="link-btn">View dance schedule →</a></p>
    <div id="vocal-content"><p>Loading…</p></div>
  `;

  setTimeout(async () => {
    const { user } = getAuthState();
    if (!user) return;

    const contentEl = document.getElementById('vocal-content');
    if (!contentEl) return;

    // Check vocal mode first
    const [studentsResult, settingsResult] = await Promise.all([
      fetchStudentsByFamily(user.id),
      fetchAuditionSettings(),
    ]);

    const students = studentsResult.data || [];
    const settings = settingsResult.data;

    if (students.length === 0) {
      contentEl.innerHTML = '<div class="placeholder-notice">No students registered yet. <a href="#/family/register">Start registration</a>.</div>';
      return;
    }

    // Day assignment mode — read-only view
    if (isDayAssignmentMode(settings)) {
      const dayAssignments = {};
      await Promise.all(
        students.map(async (s) => {
          const { data } = await fetchVocalDayAssignmentForStudent(s.id);
          if (data) dayAssignments[s.id] = data;
        }),
      );

      contentEl.innerHTML = students.map((student) => {
        const assignment = dayAssignments[student.id];
        const statusHtml = assignment
          ? `<div class="success-box" style="margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)">
              <p style="font-size:var(--text-small)">Your vocal audition day: <strong>${formatDate(assignment.audition_date)}</strong></p>
            </div>`
          : `<div class="placeholder-notice" style="margin:var(--space-sm) 0">
              Awaiting day assignment from the director. You'll be notified by email once assigned.
            </div>`;

        return `
          <div class="card" style="margin-bottom:var(--space-md)">
            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
              <div class="avatar">${(student.first_name || '?')[0]}${(student.last_name || '?')[0]}</div>
              <h3 style="margin:0">${escapeHtml(student.first_name || 'Unnamed')} ${escapeHtml(student.last_name || 'Student')}</h3>
            </div>
            ${statusHtml}
          </div>
        `;
      }).join('');
      return;
    }

    // Timeslot mode — existing picker
    const [slotsResult, countsResult] = await Promise.all([
      fetchAllVocalSlots(),
      fetchBookingCountsBySlot(),
    ]);

    const slots = slotsResult.data || [];
    const counts = countsResult.data || {};

    if (slots.length === 0) {
      contentEl.innerHTML = '<div class="placeholder-notice">No vocal slots are available yet. Please check back later.</div>';
      return;
    }

    const bookings = {};
    await Promise.all(
      students.map(async (s) => {
        const { data } = await fetchVocalBookingForStudent(s.id);
        if (data) bookings[s.id] = data;
      }),
    );

    pendingSelections = {};
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
        <div class="card" style="margin-bottom:var(--space-md)">
          <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
            <div class="avatar">${(student.first_name || '?')[0]}${(student.last_name || '?')[0]}</div>
            <h3 style="margin:0">${escapeHtml(student.first_name || 'Unnamed')} ${escapeHtml(student.last_name || 'Student')}</h3>
          </div>
          ${renderStudentStatus(eligibility, currentSlot, locked)}
          <div class="${flashMessages[student.id]?.type === 'error' ? 'warning-box' : (flashMessages[student.id]?.type === 'success' ? 'success-box' : 'form-message')}" id="vocal-msg-${student.id}" aria-live="polite" style="${flashMessages[student.id]?.text ? 'margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)' : ''}">${flashMessages[student.id]?.text || ''}</div>
          ${eligibility.eligible ? renderSlotSelector(student, slots, counts, currentBooking, now) : ''}
        </div>
      `;
    })
    .join('');

  contentEl.innerHTML = `
    ${html}
    <p class="lock-time-notice">
      Changes are locked at <strong>${LOCK_TIME_DISPLAY}</strong>. After that, only an admin can make changes.
    </p>
  `;

  bindBookingEvents(contentEl, students, slots, counts, bookings);
}

function renderStudentStatus(eligibility, currentSlot, locked) {
  if (!eligibility.eligible) {
    return `<div class="warning-box" style="margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)"><p style="font-size:var(--text-small)">${eligibility.reason}</p></div>`;
  }
  if (locked) {
    return '<div class="locked-notice">🔒 Bookings are locked for this audition date. Contact an admin for changes.</div>';
  }
  if (currentSlot) {
    return `
      <div class="success-box" style="margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)">
        <p style="font-size:var(--text-small)">✓ Booked: <strong>${formatDate(currentSlot.audition_date)}</strong>
        — ${formatTime(currentSlot.start_time)} – ${formatTime(currentSlot.end_time)}</p>
      </div>
    `;
  }
  return '<div class="placeholder-notice" style="margin:var(--space-sm) 0">Select a time slot below to book.</div>';
}

function renderSlotSelector(student, slots, counts, currentBooking, now) {
  const currentSlotId = currentBooking?.audition_slot_id;
  const hasBooking = !!currentBooking;
  const pendingId = pendingSelections[student.id];

  const byDate = {};
  slots.forEach((s) => {
    if (!byDate[s.audition_date]) byDate[s.audition_date] = [];
    byDate[s.audition_date].push(s);
  });

  let html = '';
  for (const [date, dateSlots] of Object.entries(byDate)) {
    const locked = isVocalLocked(date, now);
    html += `<h4 style="margin-top:var(--space-md);font-size:var(--text-small);color:var(--color-text-secondary)">${formatDate(date)}${locked ? ' <span style="color:var(--color-error)">🔒 Locked</span>' : ''}</h4>`;

    dateSlots.forEach((slot) => {
      const count = counts[slot.id] || 0;
      const capacity = checkSlotCapacity(count);
      const isSelected = slot.id === currentSlotId;
      const isPending = slot.id === pendingId;
      const canSelect = !locked && (capacity.available || isSelected);

      const pct = Math.min((count / VOCAL_SLOT_CAPACITY) * 100, 100);
      let barColor = 'green';
      if (pct >= 100) barColor = 'full';
      else if (pct >= 80) barColor = 'red';
      else if (pct >= 60) barColor = 'amber';

      const spotsText = `${capacity.spotsLeft}/${VOCAL_SLOT_CAPACITY} spots left`;

      let cardClass = 'session-card';
      if (isSelected) cardClass = 'session-card selected';
      else if (isPending) cardClass = 'session-card selected';
      else if (!canSelect) cardClass = 'session-card full';

      html += `
        <div class="${cardClass}">
          <div class="session-info">
            <strong>${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}</strong>
            <div class="capacity-bar" style="margin-top:var(--space-xs);max-width:200px"><div class="capacity-bar__fill capacity-bar__fill--${barColor}" style="width:${pct}%"></div></div>
            <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${spotsText}</span>
          </div>
          <div class="session-actions">
            ${isSelected
              ? `<button class="btn-small btn-secondary cancel-btn" data-student="${student.id}" ${locked ? 'disabled' : ''}>Cancel</button>`
              : `<button class="btn-small ${hasBooking ? 'reschedule-btn' : 'book-btn'}" data-student="${student.id}" data-slot="${slot.id}" ${canSelect ? '' : 'disabled'}>${isPending ? '✓ Selected' : (hasBooking ? 'Move Here' : 'Book')}</button>`
            }
          </div>
        </div>
      `;
    });
  }

  // Confirm footer if pending selection
  if (pendingId) {
    const slot = slots.find((s) => s.id === pendingId);
    const label = `${formatTime(slot?.start_time)} – ${formatTime(slot?.end_time)}`;
    const action = hasBooking ? 'Confirm Move' : 'Confirm Booking';
    html += `
      <div class="booking-footer" style="margin-top:var(--space-md);border-radius:var(--radius-sm);position:relative">
        <div class="booking-footer__info">${hasBooking ? 'Move' : 'Book'} <strong>${escapeHtml(student.first_name)}</strong> to <strong>${escapeHtml(label)}</strong></div>
        <button class="btn-accent confirm-booking-btn" data-student="${student.id}" data-slot="${pendingId}" data-action="${hasBooking ? 'reschedule' : 'book'}">${action}</button>
      </div>
    `;
  }

  return html;
}

function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-dialog-backdrop';
    backdrop.innerHTML = `
      <div class="confirm-dialog" role="alertdialog" aria-modal="true">
        <div class="confirm-dialog__title">${title}</div>
        <div class="confirm-dialog__message">${message}</div>
        <div class="confirm-dialog__actions">
          <button class="btn-ghost" data-action="cancel">Go Back</button>
          <button class="btn-primary" data-action="confirm">Confirm</button>
        </div>
      </div>
    `;
    backdrop.querySelector('[data-action="confirm"]').addEventListener('click', () => { backdrop.remove(); resolve(true); });
    backdrop.querySelector('[data-action="cancel"]').addEventListener('click', () => { backdrop.remove(); resolve(false); });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } });
    document.body.appendChild(backdrop);
    backdrop.querySelector('[data-action="confirm"]').focus();
  });
}

function bindBookingEvents(contentEl, students, slots, counts, bookings) {
  // Select buttons (book-btn and reschedule-btn) — set pending selection
  contentEl.querySelectorAll('.book-btn, .reschedule-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const studentId = btn.dataset.student;
      const slotId = btn.dataset.slot;
      pendingSelections[studentId] = slotId;
      renderStudents(contentEl, students, slots, counts, bookings);
    });
  });

  // Confirm booking buttons
  contentEl.querySelectorAll('.confirm-booking-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.student;
      const slotId = btn.dataset.slot;
      const action = btn.dataset.action;

      function showError(msg) {
        flashMessages[studentId] = { type: 'error', text: msg };
        delete pendingSelections[studentId];
        renderStudents(contentEl, students, slots, counts, bookings);
        const el = document.getElementById(`vocal-msg-${studentId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      delete flashMessages[studentId];
      btn.disabled = true;
      btn.textContent = action === 'reschedule' ? 'Moving…' : 'Booking…';

      try {
        const { error } = action === 'reschedule'
          ? await rescheduleVocalSlot(studentId, slotId)
          : await bookVocalSlot(studentId, slotId);

        if (error) {
          showError(error.message || 'Booking failed. Please try again.');
          return;
        }

        delete pendingSelections[studentId];
        flashMessages[studentId] = {
          type: 'success',
          text: action === 'reschedule' ? 'Rescheduled successfully.' : 'Booked successfully.',
        };
        await refreshAndRender(contentEl, students, slots, bookings);
      } catch (err) {
        showError(err.message || 'An unexpected error occurred. Please try again.');
      }
    });
  });

  // Cancel buttons
  contentEl.querySelectorAll('.cancel-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog(
        'Cancel Booking',
        'Cancel this vocal booking? You may lose your spot.'
      );
      if (!confirmed) return;
      const studentId = btn.dataset.student;

      function showError(msg) {
        flashMessages[studentId] = { type: 'error', text: msg };
        renderStudents(contentEl, students, slots, counts, bookings);
        const el = document.getElementById(`vocal-msg-${studentId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      delete flashMessages[studentId];
      btn.disabled = true;
      btn.textContent = 'Cancelling…';

      try {
        const { error } = await cancelVocalBooking(studentId);

        if (error) {
          showError(error.message || 'Failed to cancel. Please try again.');
          return;
        }

        delete bookings[studentId];
        flashMessages[studentId] = { type: 'success', text: 'Booking canceled.' };
        await refreshAndRender(contentEl, students, slots, bookings);
      } catch (err) {
        showError(err.message || 'An unexpected error occurred. Please try again.');
      }
    });
  });
}

async function refreshAndRender(contentEl, students, slots, bookings) {
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
