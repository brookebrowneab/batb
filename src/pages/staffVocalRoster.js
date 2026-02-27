import { getAuthState } from '../auth.js';
import { isAdmin } from '../domain/roles.js';
import { formatTime, formatDate } from '../domain/scheduling.js';
import { escapeHtml } from '../ui/escapeHtml.js';
import { VOCAL_SLOT_CAPACITY } from '../domain/vocalBooking.js';
import {
  fetchAllVocalSlots,
  fetchVocalRoster,
  fetchBookingCountsBySlot,
  generateVocalSlotsFromConfig,
  deleteVocalSlot,
  adminOverrideVocalBooking,
} from '../adapters/vocalBookings.js';
import { fetchAllConfigs } from '../adapters/scheduling.js';
import { exportVocalSlotPdf, exportVocalRosterCsv } from '../exports/index.js';
import { createSubmitGuard } from '../ui/rateLimiting.js';
import { assignVocalDay, fetchAllVocalDayAssignments, fetchAuditionSettings } from '../adapters/rolePreferences.js';
import { isDayAssignmentMode } from '../domain/rolePreferences.js';

const guardedExportPdf = createSubmitGuard(exportVocalSlotPdf);
const guardedExportCsv = createSubmitGuard(exportVocalRosterCsv);

let slots = [];
let roster = [];
let counts = {};
let dateFilter = '';
let auditionSettings = null;
let auditionDates = [];
let dayAssignments = [];
let selectedSlotIds = new Set();

export function renderStaffVocalRoster() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Vocal Roster 🎤</h1>
    <div id="vocal-roster-mode-banner"></div>
    <div id="vocal-roster-actions" style="margin-bottom:var(--space-md)"></div>
    <div class="form-message" id="vocal-roster-msg" aria-live="polite"></div>
    <div id="vocal-roster-content"><p>Loading…</p></div>
  `;

  setTimeout(() => loadAndRender(), 0);
  return container;
}

async function loadAndRender() {
  const [slotsResult, rosterResult, countsResult, settingsResult, configsResult, dayAssignmentsResult] = await Promise.all([
    fetchAllVocalSlots(),
    fetchVocalRoster(),
    fetchBookingCountsBySlot(),
    fetchAuditionSettings(),
    fetchAllConfigs(),
    fetchAllVocalDayAssignments(),
  ]);

  slots = slotsResult.data || [];
  roster = rosterResult.data || [];
  counts = countsResult.data || {};
  auditionSettings = settingsResult.data || null;
  auditionDates = [...new Set((configsResult.data || []).map((c) => c.audition_date))].sort();
  dayAssignments = dayAssignmentsResult.data || [];
  selectedSlotIds = new Set([...selectedSlotIds].filter((id) => slots.some((s) => s.id === id)));

  // Show day assignment mode banner
  const bannerEl = document.getElementById('vocal-roster-mode-banner');
  if (bannerEl && isDayAssignmentMode(auditionSettings)) {
    bannerEl.innerHTML = `
      <div class="warning-box" style="padding:var(--space-md);border-radius:var(--radius-sm);margin-bottom:var(--space-md)">
        <strong>Day Assignment Mode Active</strong>
        <p style="font-size:var(--text-small);margin:var(--space-xs) 0 0">
          Vocal auditions are using day assignment mode. Families cannot self-book timeslots.
          <a href="#/staff/vocal-assignments">Manage day assignments →</a>
        </p>
      </div>
    `;
  } else if (bannerEl) {
    bannerEl.innerHTML = '';
  }

  renderActions();
  renderContent();
}

function renderActions() {
  const actionsEl = document.getElementById('vocal-roster-actions');
  if (!actionsEl) return;
  const { role } = getAuthState();
  const dayMode = isDayAssignmentMode(auditionSettings);

  if (dayMode) {
    actionsEl.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center">
      <a href="#/staff/vocal-assignments" class="btn-primary" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Manage Vocal Day Assignments</a>
      <span style="font-size:var(--text-xs);color:var(--color-text-muted)">Day mode roster groups students by assigned audition date.</span>
    </div>
  `;
    return;
  }

  actionsEl.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center">
      <button class="btn-primary" id="generate-slots-btn">Generate Slots</button>
      <button class="btn-small" id="export-vocal-pdf-btn">📄 PDF</button>
      <button class="btn-small btn-secondary" id="export-vocal-csv-btn">📊 CSV</button>
      ${isAdmin(role) ? '<span style="font-size:var(--text-xs);color:var(--color-text-muted)">(Admin: delete slots and override bookings below)</span>' : ''}
    </div>
  `;

  document.getElementById('generate-slots-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('vocal-roster-msg');
    btn.disabled = true;
    btn.textContent = 'Generating…';
    if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

    const { user } = getAuthState();
    const { data, error } = await generateVocalSlotsFromConfig(user.id);

    if (error) {
      btn.disabled = false;
      btn.textContent = 'Generate Slots';
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to generate slots.'; }
      return;
    }

    const count = data?.length || 0;
    if (msgEl) {
      msgEl.className = 'form-message success';
      msgEl.textContent = count > 0 ? `Generated ${count} slot(s).` : 'No new slots to generate (all time blocks already exist).';
    }
    btn.disabled = false;
    btn.textContent = 'Generate Slots';
    await loadAndRender();
  });

  document.getElementById('export-vocal-pdf-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('vocal-roster-msg');
    btn.disabled = true;
    btn.textContent = 'Generating…';
    if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }
    try {
      await guardedExportPdf();
      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'PDF downloaded.'; }
    } catch (err) {
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = err.message || 'Export failed.'; }
    }
    btn.disabled = false;
    btn.textContent = '📄 PDF';
  });

  document.getElementById('export-vocal-csv-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('vocal-roster-msg');
    btn.disabled = true;
    btn.textContent = 'Exporting…';
    try {
      await guardedExportCsv();
      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'CSV downloaded.'; }
    } catch (err) {
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = err.message || 'Export failed.'; }
    }
    btn.disabled = false;
    btn.textContent = '📊 CSV';
  });
}

function renderContent() {
  const contentEl = document.getElementById('vocal-roster-content');
  if (!contentEl) return;
  const { role } = getAuthState();
  const admin = isAdmin(role);
  const dayMode = isDayAssignmentMode(auditionSettings);

  if (dayMode) {
    contentEl.innerHTML = renderDayModeContent(admin);
    bindContentEvents(contentEl);
    return;
  }

  if (slots.length === 0) {
    let html = '<div class="placeholder-notice">No vocal slots exist yet. Click "Generate Slots" to create them.</div>';
    if (admin) {
      html += renderAdminOverride(dayMode);
    }
    contentEl.innerHTML = html;
    bindContentEvents(contentEl);
    return;
  }

  const dates = [...new Set(slots.map((s) => s.audition_date))].sort();
  let html = `<div style="margin-bottom:var(--space-md)"><label for="vocal-date-filter" style="margin-right:var(--space-sm);font-weight:600;font-size:var(--text-small)">Filter by date:</label>`;
  html += `<select id="vocal-date-filter" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:var(--text-small)">`;
  html += '<option value="">All dates</option>';
  dates.forEach((d) => {
    html += `<option value="${d}" ${dateFilter === d ? 'selected' : ''}>${formatDate(d)}</option>`;
  });
  html += '</select></div>';

  const filteredSlots = dateFilter ? slots.filter((s) => s.audition_date === dateFilter) : slots;
  const allSelected = filteredSlots.length > 0 && filteredSlots.every((slot) => selectedSlotIds.has(slot.id));

  const byDate = {};
  filteredSlots.forEach((s) => {
    if (!byDate[s.audition_date]) byDate[s.audition_date] = [];
    byDate[s.audition_date].push(s);
  });

  html += `
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          ${admin ? `<th class="checkbox-cell"><input type="checkbox" id="select-all-slots-cb" ${allSelected ? 'checked' : ''} /></th>` : ''}
          <th>Date</th>
          <th>Time</th>
          <th>Booked</th>
          ${admin ? '<th>Actions</th>' : ''}
        </tr>
      </thead>
      <tbody>
  `;

  filteredSlots.forEach((s) => {
    const count = counts[s.id] || 0;
    html += `
      <tr>
        ${admin ? `<td class="checkbox-cell"><input type="checkbox" class="slot-select-cb" data-id="${s.id}" ${selectedSlotIds.has(s.id) ? 'checked' : ''} /></td>` : ''}
        <td>${formatDate(s.audition_date)}</td>
        <td>${formatTime(s.start_time)} – ${formatTime(s.end_time)}</td>
        <td>${count} / ${VOCAL_SLOT_CAPACITY}</td>
        ${admin ? `<td><button class="btn-small btn-secondary delete-slot-btn" data-id="${s.id}">Delete</button></td>` : ''}
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  if (admin && selectedSlotIds.size > 0) {
    html += `
      <div class="bulk-action-bar" style="margin-top:var(--space-sm)">
        <span class="bulk-action-bar__count">${selectedSlotIds.size} slot(s) selected</span>
        <div class="bulk-action-bar__actions">
          <button class="btn-small btn-secondary" id="bulk-delete-slots-btn">Delete Selected Slots</button>
        </div>
      </div>
    `;
  }

  html += '<h2 style="margin-top:var(--space-xl)">Attendees by Slot</h2>';

  for (const [date, dateSlots] of Object.entries(byDate)) {
    html += `<h3 style="margin-top:var(--space-md)">${formatDate(date)}</h3>`;

    dateSlots.forEach((s) => {
      const attendees = roster.filter((r) => r.audition_slot_id === s.id);
      const count = counts[s.id] || 0;
      html += `<h4 style="margin-top:var(--space-sm);font-size:var(--text-small)">${formatTime(s.start_time)} – ${formatTime(s.end_time)} (${count}/${VOCAL_SLOT_CAPACITY})</h4>`;

      if (attendees.length === 0) {
        html += '<p style="font-size:var(--text-small);color:var(--color-text-muted);margin-bottom:var(--space-sm)">No bookings yet.</p>';
      } else {
        html += '<table class="data-table"><thead><tr><th>#</th><th>Student</th><th>Grade</th></tr></thead><tbody>';
        attendees.forEach((a, i) => {
          const st = a.students;
          const profileLink = `#/staff/student-profile?id=${st?.id || ''}`;
          html += `<tr><td>${i + 1}</td><td><a href="${profileLink}">${escapeHtml(st?.first_name || '')} ${escapeHtml(st?.last_name || '')}</a></td><td>${escapeHtml(st?.grade || '—')}</td></tr>`;
        });
        html += '</tbody></table>';
      }
    });
  }

  if (admin) {
    html += renderAdminOverride(dayMode);
  }

  contentEl.innerHTML = html;
  bindContentEvents(contentEl);
}

function renderDayModeContent(admin) {
  const dates = auditionDates.length > 0
    ? auditionDates
    : [...new Set(dayAssignments.map((assignment) => assignment.audition_date))].sort();

  if (dates.length === 0) {
    let html = '<div class="placeholder-notice">No audition dates configured yet. Use Scheduling to add dates.</div>';
    if (admin) {
      html += renderAdminOverride(true);
    }
    return html;
  }

  let html = `<div style="margin-bottom:var(--space-md)"><label for="vocal-date-filter" style="margin-right:var(--space-sm);font-weight:600;font-size:var(--text-small)">Filter by date:</label>`;
  html += `<select id="vocal-date-filter" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:var(--text-small)">`;
  html += '<option value="">All dates</option>';
  dates.forEach((d) => {
    html += `<option value="${d}" ${dateFilter === d ? 'selected' : ''}>${formatDate(d)}</option>`;
  });
  html += '</select></div>';

  const filteredDates = dateFilter ? dates.filter((date) => date === dateFilter) : dates;
  const assignmentsByDate = new Map();
  filteredDates.forEach((date) => assignmentsByDate.set(date, []));

  dayAssignments.forEach((assignment) => {
    if (!assignmentsByDate.has(assignment.audition_date)) return;
    assignmentsByDate.get(assignment.audition_date).push(assignment);
  });

  html += '<h2 style="margin-top:var(--space-sm)">Students by Vocal Day</h2>';
  filteredDates.forEach((date) => {
    const rows = assignmentsByDate.get(date) || [];
    html += `
      <h3 style="margin-top:var(--space-md)">${formatDate(date)} (${rows.length})</h3>
    `;
    if (rows.length === 0) {
      html += '<p style="font-size:var(--text-small);color:var(--color-text-muted);margin-bottom:var(--space-sm)">No students assigned to this day.</p>';
      return;
    }
    html += '<table class="data-table"><thead><tr><th>#</th><th>Student</th><th>Grade</th></tr></thead><tbody>';
    rows.forEach((assignment, index) => {
      const student = assignment.students;
      const profileLink = `#/staff/student-profile?id=${student?.id || ''}`;
      html += `<tr><td>${index + 1}</td><td><a href="${profileLink}">${escapeHtml(student?.first_name || '')} ${escapeHtml(student?.last_name || '')}</a></td><td>${escapeHtml(student?.grade || '—')}</td></tr>`;
    });
    html += '</tbody></table>';
  });

  const unassignedCount = dayAssignments.filter((assignment) => !assignment.audition_date).length;
  if (unassignedCount > 0) {
    html += `<p style="margin-top:var(--space-sm);font-size:var(--text-small);color:var(--color-text-muted)">${unassignedCount} assignment(s) missing a date.</p>`;
  }

  if (admin) {
    html += renderAdminOverride(true);
  }
  return html;
}

function renderAdminOverride(dayMode) {
  const slotOptions = slots
    .map((s) => `<option value="${s.id}">${formatDate(s.audition_date)} — ${formatTime(s.start_time)}–${formatTime(s.end_time)}</option>`)
    .join('');
  const fallbackDates = [...new Set(slots.map((s) => s.audition_date))].sort();
  const dates = auditionDates.length > 0 ? auditionDates : fallbackDates;
  const dateOptions = dates
    .map((date) => `<option value="${date}">${formatDate(date)}</option>`)
    .join('');

  return `
    <hr>
    <h2>Admin Override</h2>
    <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">${
      dayMode
        ? "Assign or change a student's vocal audition day."
        : "Assign or change a student's vocal slot (bypasses lock time and capacity)."
    }</p>
    <div class="login-form" style="max-width:500px">
      <label for="vocal-override-student-id">Student ID</label>
      <input type="text" id="vocal-override-student-id" placeholder="Paste student UUID" />
      ${
        dayMode
          ? `<label for="vocal-override-day">Vocal Day</label>
      <select id="vocal-override-day" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body)">
        <option value="">Select a day…</option>
        ${dateOptions}
      </select>`
          : `<label for="vocal-override-slot">Vocal Slot</label>
      <select id="vocal-override-slot" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body)">
        <option value="">Select a slot…</option>
        ${slotOptions}
      </select>`
      }
      <button id="vocal-override-btn" class="btn-primary">${dayMode ? 'Assign Day' : 'Assign Slot'}</button>
      <div class="form-message" id="vocal-override-msg" aria-live="polite"></div>
    </div>
  `;
}

function bindContentEvents(contentEl) {
  const filterEl = document.getElementById('vocal-date-filter');
  if (filterEl) {
    filterEl.addEventListener('change', () => {
      dateFilter = filterEl.value;
      renderContent();
    });
  }

  const selectAllSlotsCb = document.getElementById('select-all-slots-cb');
  if (selectAllSlotsCb) {
    selectAllSlotsCb.addEventListener('change', () => {
      const filteredSlots = dateFilter ? slots.filter((s) => s.audition_date === dateFilter) : slots;
      if (selectAllSlotsCb.checked) {
        filteredSlots.forEach((slot) => selectedSlotIds.add(slot.id));
      } else {
        filteredSlots.forEach((slot) => selectedSlotIds.delete(slot.id));
      }
      renderContent();
    });
  }

  contentEl.querySelectorAll('.slot-select-cb').forEach((cb) => {
    cb.addEventListener('change', () => {
      if (cb.checked) selectedSlotIds.add(cb.dataset.id);
      else selectedSlotIds.delete(cb.dataset.id);
      renderContent();
    });
  });

  contentEl.querySelectorAll('.delete-slot-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!window.confirm('Delete this vocal slot? Any existing bookings will be removed.')) return;
      const slotId = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Deleting…';

      const { error } = await deleteVocalSlot(slotId);
      const msgEl = document.getElementById('vocal-roster-msg');

      if (error) {
        btn.disabled = false;
        btn.textContent = 'Delete';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to delete slot.'; }
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Slot deleted.'; }
      selectedSlotIds.delete(slotId);
      await loadAndRender();
    });
  });

  const bulkDeleteBtn = document.getElementById('bulk-delete-slots-btn');
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', async () => {
      if (selectedSlotIds.size === 0) return;
      if (!window.confirm(`Delete ${selectedSlotIds.size} selected vocal slot(s)? Any existing bookings will be removed.`)) return;

      const msgEl = document.getElementById('vocal-roster-msg');
      bulkDeleteBtn.disabled = true;
      bulkDeleteBtn.textContent = 'Deleting…';

      let deleted = 0;
      let failed = 0;
      for (const slotId of selectedSlotIds) {
        const { error } = await deleteVocalSlot(slotId);
        if (error) failed++;
        else deleted++;
      }

      bulkDeleteBtn.disabled = false;
      bulkDeleteBtn.textContent = 'Delete Selected Slots';
      selectedSlotIds.clear();

      if (msgEl) {
        if (failed === 0) {
          msgEl.className = 'form-message success';
          msgEl.textContent = `Deleted ${deleted} slot(s).`;
        } else {
          msgEl.className = 'form-message error';
          msgEl.textContent = `Deleted ${deleted} slot(s), ${failed} failed.`;
        }
      }
      await loadAndRender();
    });
  }

  const overrideBtn = document.getElementById('vocal-override-btn');
  if (overrideBtn) {
    overrideBtn.addEventListener('click', async () => {
      const dayMode = isDayAssignmentMode(auditionSettings);
      const studentId = document.getElementById('vocal-override-student-id')?.value?.trim();
      const slotId = document.getElementById('vocal-override-slot')?.value;
      const auditionDate = document.getElementById('vocal-override-day')?.value;
      const msgEl = document.getElementById('vocal-override-msg');

      if (!studentId || (!dayMode && !slotId) || (dayMode && !auditionDate)) {
        if (msgEl) {
          msgEl.className = 'form-message error';
          msgEl.textContent = dayMode
            ? 'Both student ID and day are required.'
            : 'Both student ID and slot are required.';
        }
        return;
      }

      overrideBtn.disabled = true;
      overrideBtn.textContent = 'Assigning…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const { error } = dayMode
        ? await assignVocalDay(studentId, auditionDate)
        : await adminOverrideVocalBooking(studentId, slotId);

      if (error) {
        overrideBtn.disabled = false;
        overrideBtn.textContent = dayMode ? 'Assign Day' : 'Assign Slot';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Override failed.'; }
        return;
      }

      if (msgEl) {
        msgEl.className = 'form-message success';
        msgEl.textContent = dayMode ? 'Student assigned to day.' : 'Student assigned to slot.';
      }
      overrideBtn.disabled = false;
      overrideBtn.textContent = dayMode ? 'Assign Day' : 'Assign Slot';
      await loadAndRender();
    });
  }
}
