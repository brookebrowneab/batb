import { getAuthState } from '../auth.js';
import { isAdmin } from '../domain/roles.js';
import { formatTime } from '../domain/scheduling.js';
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
import { exportVocalSlotPdf, exportVocalRosterCsv } from '../exports/index.js';

let slots = [];
let roster = [];
let counts = {};
let dateFilter = '';

export function renderStaffVocalRoster() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Vocal Roster</h1>
    <p><a href="#/staff">&larr; Back to Staff Dashboard</a></p>
    <div id="vocal-roster-actions" style="margin-bottom:1rem"></div>
    <div class="form-message" id="vocal-roster-msg" aria-live="polite"></div>
    <div id="vocal-roster-content"><p>Loading…</p></div>
  `;

  setTimeout(() => loadAndRender(), 0);
  return container;
}

async function loadAndRender() {
  const [slotsResult, rosterResult, countsResult] = await Promise.all([
    fetchAllVocalSlots(),
    fetchVocalRoster(),
    fetchBookingCountsBySlot(),
  ]);

  slots = slotsResult.data || [];
  roster = rosterResult.data || [];
  counts = countsResult.data || {};

  renderActions();
  renderContent();
}

function renderActions() {
  const actionsEl = document.getElementById('vocal-roster-actions');
  if (!actionsEl) return;
  const { role } = getAuthState();

  actionsEl.innerHTML = `
    <button class="btn-small" id="generate-slots-btn">Generate Slots from Config</button>
    <button class="btn-small" id="export-vocal-pdf-btn">Export PDF</button>
    <button class="btn-small btn-secondary" id="export-vocal-csv-btn">Export CSV</button>
    ${isAdmin(role) ? '<span style="margin-left:0.5rem;font-size:0.75rem;color:#6c757d">(Admin: you can delete slots and override bookings below)</span>' : ''}
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
      btn.textContent = 'Generate Slots from Config';
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Failed to generate slots.'; }
      return;
    }

    const count = data?.length || 0;
    if (msgEl) {
      msgEl.className = 'form-message success';
      msgEl.textContent = count > 0 ? `Generated ${count} slot(s).` : 'No new slots to generate (all time blocks already exist).';
    }
    btn.disabled = false;
    btn.textContent = 'Generate Slots from Config';
    await loadAndRender();
  });

  document.getElementById('export-vocal-pdf-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('vocal-roster-msg');
    btn.disabled = true;
    btn.textContent = 'Generating PDF…';
    if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }
    try {
      await exportVocalSlotPdf();
      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'PDF downloaded.'; }
    } catch (err) {
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = err.message || 'Export failed.'; }
    }
    btn.disabled = false;
    btn.textContent = 'Export PDF';
  });

  document.getElementById('export-vocal-csv-btn')?.addEventListener('click', async (e) => {
    const btn = e.target;
    const msgEl = document.getElementById('vocal-roster-msg');
    btn.disabled = true;
    btn.textContent = 'Exporting…';
    try {
      await exportVocalRosterCsv();
      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'CSV downloaded.'; }
    } catch (err) {
      if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = err.message || 'Export failed.'; }
    }
    btn.disabled = false;
    btn.textContent = 'Export CSV';
  });
}

function renderContent() {
  const contentEl = document.getElementById('vocal-roster-content');
  if (!contentEl) return;
  const { role } = getAuthState();
  const admin = isAdmin(role);

  if (slots.length === 0) {
    contentEl.innerHTML = '<div class="placeholder-notice">No vocal slots exist yet. Click "Generate Slots from Config" to create them.</div>';
    return;
  }

  // Date filter
  const dates = [...new Set(slots.map((s) => s.audition_date))].sort();
  let html = '<div style="margin-bottom:1rem"><label for="vocal-date-filter" style="margin-right:0.5rem"><strong>Filter by date:</strong></label>';
  html += '<select id="vocal-date-filter" style="padding:0.4rem;border:1px solid #ced4da;border-radius:4px">';
  html += '<option value="">All dates</option>';
  dates.forEach((d) => {
    html += `<option value="${d}" ${dateFilter === d ? 'selected' : ''}>${d}</option>`;
  });
  html += '</select></div>';

  const filteredSlots = dateFilter ? slots.filter((s) => s.audition_date === dateFilter) : slots;

  // Group filtered slots by date
  const byDate = {};
  filteredSlots.forEach((s) => {
    if (!byDate[s.audition_date]) byDate[s.audition_date] = [];
    byDate[s.audition_date].push(s);
  });

  html += `
    <table class="data-table">
      <thead>
        <tr>
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
        <td>${s.audition_date}</td>
        <td>${formatTime(s.start_time)} – ${formatTime(s.end_time)}</td>
        <td>${count} / ${VOCAL_SLOT_CAPACITY}</td>
        ${admin ? `<td><button class="btn-small btn-secondary delete-slot-btn" data-id="${s.id}">Delete</button></td>` : ''}
      </tr>
    `;
  });

  html += '</tbody></table>';

  // Roster grouped by slot
  html += '<h2 style="margin-top:1.5rem">Attendees by Slot</h2>';

  for (const [date, dateSlots] of Object.entries(byDate)) {
    html += `<h3 style="margin-top:1rem">${date}</h3>`;

    dateSlots.forEach((s) => {
      const attendees = roster.filter((r) => r.audition_slot_id === s.id);
      const count = counts[s.id] || 0;
      html += `<h4 style="margin-top:0.5rem;font-size:0.9rem">${formatTime(s.start_time)} – ${formatTime(s.end_time)} (${count}/${VOCAL_SLOT_CAPACITY})</h4>`;

      if (attendees.length === 0) {
        html += '<p style="font-size:0.875rem;color:#6c757d;margin-bottom:0.5rem">No bookings yet.</p>';
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

  // Admin override section
  if (admin) {
    html += renderAdminOverride();
  }

  contentEl.innerHTML = html;
  bindContentEvents(contentEl);
}

function renderAdminOverride() {
  const slotOptions = slots
    .map((s) => `<option value="${s.id}">${s.audition_date} — ${formatTime(s.start_time)}–${formatTime(s.end_time)}</option>`)
    .join('');

  return `
    <hr>
    <h2>Admin Override</h2>
    <p style="font-size:0.875rem;color:#6c757d;margin-bottom:0.75rem">Assign or change a student's vocal slot (bypasses lock time and capacity).</p>
    <div class="login-form" style="max-width:500px">
      <label for="vocal-override-student-id">Student ID</label>
      <input type="text" id="vocal-override-student-id" placeholder="Paste student UUID" />
      <label for="vocal-override-slot">Vocal Slot</label>
      <select id="vocal-override-slot" style="padding:0.5rem;border:1px solid #ced4da;border-radius:4px">
        <option value="">Select a slot…</option>
        ${slotOptions}
      </select>
      <button id="vocal-override-btn">Assign Slot</button>
      <div class="form-message" id="vocal-override-msg" aria-live="polite"></div>
    </div>
  `;
}

function bindContentEvents(contentEl) {
  // Date filter
  const filterEl = document.getElementById('vocal-date-filter');
  if (filterEl) {
    filterEl.addEventListener('change', () => {
      dateFilter = filterEl.value;
      renderContent();
    });
  }

  // Delete slot buttons
  contentEl.querySelectorAll('.delete-slot-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
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
      await loadAndRender();
    });
  });

  // Admin override button
  const overrideBtn = document.getElementById('vocal-override-btn');
  if (overrideBtn) {
    overrideBtn.addEventListener('click', async () => {
      const studentId = document.getElementById('vocal-override-student-id')?.value?.trim();
      const slotId = document.getElementById('vocal-override-slot')?.value;
      const msgEl = document.getElementById('vocal-override-msg');

      if (!studentId || !slotId) {
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = 'Both student ID and slot are required.'; }
        return;
      }

      overrideBtn.disabled = true;
      overrideBtn.textContent = 'Assigning…';
      if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }

      const { error } = await adminOverrideVocalBooking(studentId, slotId);

      if (error) {
        overrideBtn.disabled = false;
        overrideBtn.textContent = 'Assign Slot';
        if (msgEl) { msgEl.className = 'form-message error'; msgEl.textContent = error.message || 'Override failed.'; }
        return;
      }

      if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = 'Student assigned to slot.'; }
      overrideBtn.disabled = false;
      overrideBtn.textContent = 'Assign Slot';
      await loadAndRender();
    });
  }
}
