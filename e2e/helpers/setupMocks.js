// ============================================================
// Supabase API Mock for Playwright E2E Tests
// ============================================================

import {
  SUPABASE_URL,
  STORAGE_KEY,
  FAMILY_USER,
  FAMILY_SESSION,
  STAFF_USER,
  STAFF_SESSION,
  STAFF_PROFILE,
  ADMIN_USER,
  ADMIN_SESSION,
  ADMIN_PROFILE,
  makeSession,
} from './mockData.js';

// --- Auth Helpers ---

export async function setFamilyAuth(page) {
  await page.addInitScript(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    { key: STORAGE_KEY, session: FAMILY_SESSION },
  );
}

export async function setStaffAuth(page) {
  await page.addInitScript(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    { key: STORAGE_KEY, session: STAFF_SESSION },
  );
}

export async function setAdminAuth(page) {
  await page.addInitScript(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    { key: STORAGE_KEY, session: ADMIN_SESSION },
  );
}

// --- PostgREST Query Filter ---

function applyFilters(data, searchParams) {
  if (!Array.isArray(data)) return data;
  let filtered = [...data];

  for (const [key, value] of searchParams.entries()) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(key)) continue;
    if (value.startsWith('eq.')) {
      const filterVal = value.slice(3);
      filtered = filtered.filter((item) => String(item[key]) === filterVal);
    } else if (value.startsWith('is.')) {
      const filterVal = value.slice(3);
      if (filterVal === 'null') {
        filtered = filtered.filter((item) => item[key] === null || item[key] === undefined);
      } else if (filterVal === 'true') {
        filtered = filtered.filter((item) => item[key] === true);
      } else if (filterVal === 'false') {
        filtered = filtered.filter((item) => item[key] === false);
      }
    }
  }

  return filtered;
}

function matchesFilters(item, searchParams) {
  for (const [key, value] of searchParams.entries()) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(key)) continue;
    if (value.startsWith('eq.')) {
      const filterVal = value.slice(3);
      if (String(item[key]) !== filterVal) return false;
    } else if (value.startsWith('is.')) {
      const filterVal = value.slice(3);
      if (filterVal === 'null' && item[key] !== null && item[key] !== undefined) return false;
      if (filterVal === 'true' && item[key] !== true) return false;
      if (filterVal === 'false' && item[key] !== false) return false;
    }
  }
  return true;
}

// --- Table name → mock data mapping ---

function getTableData(tableName, mockData) {
  const map = {
    students: mockData.students ?? [],
    contracts: mockData.contracts ?? [],
    contract_acceptances: mockData.contractAcceptances ?? [],
    dance_sessions: mockData.danceSessions ?? [],
    dance_signups: mockData.danceSignups ?? [],
    audition_slots: mockData.vocalSlots ?? [],
    vocal_bookings: mockData.vocalBookings ?? [],
    vocal_day_assignments: mockData.vocalDayAssignments ?? [],
    audition_window_config: mockData.configs ?? [],
    student_evaluations: mockData.evaluations ?? [],
    notification_sends: mockData.notificationSends ?? [],
    staff_profiles: mockData.staffProfiles ?? [],
    audition_roles: mockData.auditionRoles ?? [],
    audition_settings: mockData.auditionSettings ?? [],
    registration_email_templates: mockData.registrationEmailTemplates ?? [],
    admin_audit_log: [],
  };
  return map[tableName];
}

// --- Supabase Mock Setup ---

export async function setupSupabaseMock(page, options = {}) {
  const mockData = {
    students: options.students ?? [],
    contracts: options.contracts ?? [],
    contractAcceptances: options.contractAcceptances ?? [],
    danceSessions: options.danceSessions ?? [],
    danceSignups: options.danceSignups ?? [],
    vocalSlots: options.vocalSlots ?? [],
    vocalBookings: options.vocalBookings ?? [],
    vocalDayAssignments: options.vocalDayAssignments ?? [],
    configs: options.configs ?? [],
    evaluations: options.evaluations ?? [],
    notificationSends: options.notificationSends ?? [],
    staffProfiles: options.staffProfiles ?? [],
    auditionRoles: options.auditionRoles ?? [],
    auditionSettings: options.auditionSettings ?? [],
    registrationEmailTemplates: options.registrationEmailTemplates ?? [],
    signupCounts: options.signupCounts ?? {},
    bookingCounts: options.bookingCounts ?? {},
    onRpc: options.onRpc ?? {},
    authUser: options.authUser ?? null,
  };

  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname;
    const headers = route.request().headers();
    const accept = headers['accept'] || '';
    const isSingleObject = accept.includes('application/vnd.pgrst.object+json');

    // --- Auth endpoints ---
    if (path.startsWith('/auth/v1/')) {
      return handleAuth(route, path, method, url, mockData);
    }

    // --- RPC endpoints ---
    if (path.startsWith('/rest/v1/rpc/')) {
      return handleRpc(route, path, method, mockData);
    }

    // --- Storage endpoints ---
    if (path.startsWith('/storage/v1/')) {
      return handleStorage(route, path, method);
    }

    // --- Edge Function endpoints ---
    if (path.startsWith('/functions/v1/')) {
      return handleFunctions(route, path, method);
    }

    // --- REST table endpoints ---
    const tableName = path.replace('/rest/v1/', '').split('?')[0];
    const tableData = getTableData(tableName, mockData);

    if (tableData === undefined) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }

    // GET — read
    if (method === 'GET') {
      const filtered = applyFilters(tableData, url.searchParams);
      if (isSingleObject) {
        if (filtered.length === 0) {
          return route.fulfill({
            status: 406,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'PGRST116',
              message: 'JSON object requested, multiple (or no) rows returned',
              details: 'The result contains 0 rows',
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(filtered[0]),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    }

    // POST — insert
    if (method === 'POST') {
      let body = {};
      try {
        body = JSON.parse(route.request().postData() || '{}');
      } catch {
        /* empty */
      }
      const created = {
        id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...body,
      };
      if (Array.isArray(tableData)) tableData.push(created);
      if (isSingleObject) {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      }
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([created]),
      });
    }

    // PATCH — update
    if (method === 'PATCH') {
      let body = {};
      try {
        body = JSON.parse(route.request().postData() || '{}');
      } catch {
        /* empty */
      }
      const existing = applyFilters(tableData, url.searchParams);
      const updated = { ...(existing[0] || {}), ...body, updated_at: new Date().toISOString() };
      if (Array.isArray(tableData)) {
        tableData.forEach((item, idx) => {
          if (matchesFilters(item, url.searchParams)) {
            tableData[idx] = { ...item, ...body, updated_at: new Date().toISOString() };
          }
        });
      }
      if (isSingleObject) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updated),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([updated]),
      });
    }

    // DELETE
    if (method === 'DELETE') {
      if (Array.isArray(tableData)) {
        const remaining = tableData.filter((item) => !matchesFilters(item, url.searchParams));
        tableData.length = 0;
        tableData.push(...remaining);
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    // Fallback
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

// --- Auth handler ---

function handleAuth(route, path, method, url, mockData) {
  // Token exchange (login)
  if (path.includes('/token') && method === 'POST') {
    const grantType = url.searchParams.get('grant_type');
    if (grantType === 'password') {
      // Return whichever user session is configured
      const user = mockData.authUser || FAMILY_USER;
      const session = makeSession(user);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(session),
      });
    }
    if (grantType === 'refresh_token') {
      const user = mockData.authUser || FAMILY_USER;
      const session = makeSession(user);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(session),
      });
    }
  }

  // Signup
  if (path.includes('/signup') && method === 'POST') {
    const user = { ...FAMILY_USER, id: `new-${Date.now()}`, email: 'new@example.com' };
    const session = makeSession(user);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  }

  // Magic link
  if (path.includes('/magiclink') && method === 'POST') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  }

  // Get user
  if (path.includes('/user') && method === 'GET') {
    const user = mockData.authUser || FAMILY_USER;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  }

  // Logout
  if (path.includes('/logout')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  }

  // Session check
  if (path.includes('/session')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  }

  // Fallback for any auth endpoint
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
}

// --- RPC handler ---

function handleRpc(route, path, method, mockData) {
  const rpcName = path.split('/rest/v1/rpc/')[1];
  let args = {};
  try {
    args = JSON.parse(route.request().postData() || '{}');
  } catch {
    args = {};
  }

  // Custom RPC handlers from test options
  if (mockData.onRpc && mockData.onRpc[rpcName]) {
    const result = mockData.onRpc[rpcName];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(result),
    });
  }

  // Default RPC responses
  const rpcDefaults = {
    upsert_dance_signup: 'signup-mock-id',
    delete_dance_signup: null,
    admin_update_dance_signup: 'signup-mock-id',
    book_vocal_slot: 'booking-mock-id',
    reschedule_vocal_slot: 'booking-mock-id',
    cancel_vocal_booking: null,
    admin_override_vocal_booking: 'booking-mock-id',
    admin_delete_vocal_slot: null,
    toggle_callback_invite: null,
    log_notification_send: 'notif-mock-id',
    log_admin_audit: 'audit-mock-id',
    activate_contract: null,
  };

  let body = rpcName in rpcDefaults ? rpcDefaults[rpcName] : null;

  if (rpcName === 'upsert_dance_signup') {
    const studentId = args.p_student_id;
    const sessionId = args.p_dance_session_id;
    const session = mockData.danceSessions.find((s) => s.id === sessionId) || null;
    const student = mockData.students.find((s) => s.id === studentId) || null;
    const existingIdx = mockData.danceSignups.findIndex((s) => s.student_id === studentId);
    const next = {
      id: existingIdx >= 0 ? mockData.danceSignups[existingIdx].id : `signup-${Date.now()}`,
      student_id: studentId,
      dance_session_id: sessionId,
      dance_sessions: session,
      students: student,
      updated_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) mockData.danceSignups[existingIdx] = { ...mockData.danceSignups[existingIdx], ...next };
    else mockData.danceSignups.push(next);
    body = next.id;
  } else if (rpcName === 'delete_dance_signup') {
    const studentId = args.p_student_id;
    mockData.danceSignups = mockData.danceSignups.filter((s) => s.student_id !== studentId);
    body = null;
  } else if (rpcName === 'admin_update_dance_signup') {
    const studentId = args.p_student_id;
    const sessionId = args.p_dance_session_id;
    const session = mockData.danceSessions.find((s) => s.id === sessionId) || null;
    const student = mockData.students.find((s) => s.id === studentId) || null;
    const existingIdx = mockData.danceSignups.findIndex((s) => s.student_id === studentId);
    const next = {
      id: existingIdx >= 0 ? mockData.danceSignups[existingIdx].id : `signup-${Date.now()}`,
      student_id: studentId,
      dance_session_id: sessionId,
      dance_sessions: session,
      students: student,
      updated_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) mockData.danceSignups[existingIdx] = { ...mockData.danceSignups[existingIdx], ...next };
    else mockData.danceSignups.push(next);
    body = next.id;
  } else if (rpcName === 'book_vocal_slot' || rpcName === 'reschedule_vocal_slot' || rpcName === 'admin_override_vocal_booking') {
    const studentId = args.p_student_id;
    const slotId = args.p_new_slot_id || args.p_slot_id;
    const slot = mockData.vocalSlots.find((s) => s.id === slotId) || null;
    const student = mockData.students.find((s) => s.id === studentId) || null;
    const existingIdx = mockData.vocalBookings.findIndex((b) => b.student_id === studentId);
    const next = {
      id: existingIdx >= 0 ? mockData.vocalBookings[existingIdx].id : `booking-${Date.now()}`,
      student_id: studentId,
      audition_slot_id: slotId,
      audition_slots: slot,
      students: student,
      updated_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) mockData.vocalBookings[existingIdx] = { ...mockData.vocalBookings[existingIdx], ...next };
    else mockData.vocalBookings.push(next);
    body = next.id;
  } else if (rpcName === 'cancel_vocal_booking') {
    const studentId = args.p_student_id;
    mockData.vocalBookings = mockData.vocalBookings.filter((b) => b.student_id !== studentId);
    body = null;
  } else if (rpcName === 'admin_delete_vocal_slot') {
    const slotId = args.p_slot_id;
    mockData.vocalBookings = mockData.vocalBookings.filter((b) => b.audition_slot_id !== slotId);
    mockData.vocalSlots = mockData.vocalSlots.filter((s) => s.id !== slotId);
    body = null;
  } else if (rpcName === 'toggle_callback_invite') {
    const studentId = args.p_student_id;
    const invited = !!args.p_invited;
    const student = mockData.students.find((s) => s.id === studentId);
    if (student) student.callback_invited = invited;
    body = null;
  }

  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

// --- Storage handler ---

function handleStorage(route, path, method) {
  // Upload
  if (method === 'POST') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ Key: 'student-photos/mock-path.jpg' }),
    });
  }

  // Signed URL
  if (path.includes('/sign/') || path.includes('/create-signed-url')) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ signedUrl: 'https://example.com/mock-photo.jpg' }),
    });
  }

  // Delete
  if (method === 'DELETE') {
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  }

  // Fallback
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
}

// --- Edge Function handler ---

function handleFunctions(route, path, method) {
  if (method !== 'POST') {
    return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ error: 'Method not allowed' }) });
  }

  const fnName = path.split('/functions/v1/')[1];
  if (fnName === 'send-notification-email') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, id: `email-${Date.now()}` }),
    });
  }

  if (fnName === 'send-registration-schedule-email') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, studentId: 'mock-student-id' }),
    });
  }

  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true }),
  });
}

// --- Convenience: login + mock in one call ---

export async function loginAsFamily(page, options = {}) {
  await setFamilyAuth(page);
  await setupSupabaseMock(page, {
    staffProfiles: [],
    authUser: FAMILY_USER,
    ...options,
  });
}

export async function loginAsStaff(page, options = {}) {
  await setStaffAuth(page);
  await setupSupabaseMock(page, {
    staffProfiles: [STAFF_PROFILE],
    authUser: STAFF_USER,
    ...options,
  });
}

export async function loginAsAdmin(page, options = {}) {
  await setAdminAuth(page);
  await setupSupabaseMock(page, {
    staffProfiles: [ADMIN_PROFILE],
    authUser: ADMIN_USER,
    ...options,
  });
}
