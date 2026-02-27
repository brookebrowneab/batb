// ============================================================
// BATB E2E Test Mock Data
// ============================================================

export const SUPABASE_URL = 'https://ekukdlvpgamqsmuvrgby.supabase.co';
export const PROJECT_REF = 'ekukdlvpgamqsmuvrgby';
export const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

// --- Users ---

export const FAMILY_USER = {
  id: 'fam-11111111-1111-1111-1111-111111111111',
  email: 'parent@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
};

export const STAFF_USER = {
  id: 'staff-22222222-2222-2222-2222-222222222222',
  email: 'staff@theater.org',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
};

export const ADMIN_USER = {
  id: 'admin-33333333-3333-3333-3333-333333333333',
  email: 'admin@theater.org',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
};

// --- Session builder ---

export function makeSession(user) {
  return {
    access_token: `fake-access-token-${user.id}`,
    token_type: 'bearer',
    expires_in: 86400 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 365,
    refresh_token: `fake-refresh-${user.id}`,
    user,
  };
}

export const FAMILY_SESSION = makeSession(FAMILY_USER);
export const STAFF_SESSION = makeSession(STAFF_USER);
export const ADMIN_SESSION = makeSession(ADMIN_USER);

// --- Staff Profiles ---

export const STAFF_PROFILE = {
  id: STAFF_USER.id,
  display_name: 'Stage Manager',
  role: 'director',
  email: STAFF_USER.email,
};

export const ADMIN_PROFILE = {
  id: ADMIN_USER.id,
  display_name: 'Show Director',
  role: 'admin',
  email: ADMIN_USER.email,
};

// --- Students ---

export const STUDENT_BELLE = {
  id: 'student-aaaa-1111',
  first_name: 'Belle',
  last_name: 'French',
  grade: '10',
  family_account_id: FAMILY_USER.id,
  registration_complete: true,
  parent_first_name: 'Maurice',
  parent_last_name: 'French',
  parent_email: 'parent@example.com',
  parent_phone: '555-0123',
  photo_storage_path: null,
  callback_invited: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by_user_id: FAMILY_USER.id,
  updated_by_user_id: FAMILY_USER.id,
};

export const STUDENT_INCOMPLETE = {
  id: 'student-aaaa-2222',
  first_name: 'Chip',
  last_name: 'French',
  grade: '6',
  family_account_id: FAMILY_USER.id,
  registration_complete: false,
  parent_first_name: null,
  parent_last_name: null,
  parent_email: null,
  parent_phone: null,
  photo_storage_path: null,
  callback_invited: false,
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  created_by_user_id: FAMILY_USER.id,
  updated_by_user_id: FAMILY_USER.id,
};

export const STUDENT_CALLBACK = {
  ...STUDENT_BELLE,
  id: 'student-aaaa-3333',
  first_name: 'Lumiere',
  callback_invited: true,
};

// --- Contracts ---

export const ACTIVE_CONTRACT = {
  id: 'contract-1111',
  version_number: 1,
  text_snapshot: '<h2>Show Agreement</h2><p>I agree to participate in Beauty and the Beast auditions and follow all rules and guidelines.</p>',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  created_by_staff_user_id: ADMIN_USER.id,
};

export const INACTIVE_CONTRACT = {
  id: 'contract-2222',
  version_number: 2,
  text_snapshot: '<h2>Updated Agreement</h2><p>Updated terms.</p>',
  is_active: false,
  created_at: '2024-02-01T00:00:00Z',
  created_by_staff_user_id: ADMIN_USER.id,
};

// --- Contract Acceptances ---

export const BELLE_ACCEPTANCE = {
  id: 'accept-1111',
  student_id: STUDENT_BELLE.id,
  contract_id: ACTIVE_CONTRACT.id,
  student_typed_signature: 'Belle French',
  parent_typed_signature: 'Maurice French',
  signed_by_user_id: FAMILY_USER.id,
  created_at: '2024-01-15T00:00:00Z',
  contracts: ACTIVE_CONTRACT,
};

// --- Dance Sessions ---

export const DANCE_SESSION_A = {
  id: 'dance-sess-1111',
  audition_date: '2027-06-15',
  start_time: '09:00:00',
  end_time: '10:00:00',
  label: 'Morning Group A',
  capacity: 20,
  created_at: '2024-01-01T00:00:00Z',
};

export const DANCE_SESSION_B = {
  id: 'dance-sess-2222',
  audition_date: '2027-06-15',
  start_time: '10:30:00',
  end_time: '11:30:00',
  label: 'Morning Group B',
  capacity: 20,
  created_at: '2024-01-01T00:00:00Z',
};

// --- Dance Signups ---

export const BELLE_DANCE_SIGNUP = {
  id: 'signup-1111',
  student_id: STUDENT_BELLE.id,
  dance_session_id: DANCE_SESSION_A.id,
  dance_sessions: DANCE_SESSION_A,
  students: STUDENT_BELLE,
  created_at: '2024-01-15T00:00:00Z',
};

// --- Vocal Slots ---

export const VOCAL_SLOT_1 = {
  id: 'vocal-slot-1111',
  audition_date: '2027-06-16',
  start_time: '09:00:00',
  end_time: '09:15:00',
  created_at: '2024-01-01T00:00:00Z',
};

export const VOCAL_SLOT_2 = {
  id: 'vocal-slot-2222',
  audition_date: '2027-06-16',
  start_time: '09:15:00',
  end_time: '09:30:00',
  created_at: '2024-01-01T00:00:00Z',
};

// --- Vocal Bookings ---

export const BELLE_VOCAL_BOOKING = {
  id: 'booking-1111',
  student_id: STUDENT_BELLE.id,
  audition_slot_id: VOCAL_SLOT_1.id,
  audition_slots: VOCAL_SLOT_1,
  students: STUDENT_BELLE,
  created_at: '2024-01-15T00:00:00Z',
};

// --- Audition Window Configs ---

export const CONFIG_1 = {
  id: 'config-1111',
  audition_date: '2027-06-15',
  dance_start_time: '09:00:00',
  dance_end_time: '12:00:00',
  vocal_start_time: '13:00:00',
  vocal_end_time: '16:00:00',
  callback_start_time: '17:00:00',
  callback_end_time: '19:00:00',
  updated_at: '2024-01-01T00:00:00Z',
  created_by_staff_user_id: ADMIN_USER.id,
};

// --- Evaluations ---

export const EVAL_DANCE = {
  id: 'eval-1111',
  student_id: STUDENT_BELLE.id,
  staff_user_id: STAFF_USER.id,
  track: 'dance',
  notes: 'Great technique and stage presence.',
  created_at: '2024-06-15T10:00:00Z',
  staff_profiles: { display_name: 'Stage Manager' },
};

// --- Notification History ---

export const NOTIFICATION_1 = {
  id: 'notif-1111',
  student_id: STUDENT_BELLE.id,
  recipient_email: 'parent@example.com',
  subject: 'Callback Invitation',
  body_preview: 'Your child has been invited to callbacks!',
  status: 'sent',
  created_at: '2024-06-16T10:00:00Z',
  students: STUDENT_BELLE,
};
