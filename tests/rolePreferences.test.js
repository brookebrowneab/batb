import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  isDayAssignmentMode,
  isTimeslotMode,
  validateRolePreferences,
  sortPreferencesByRank,
  groupStudentsByTopRole,
  groupStudentsByAssignedDate,
  generateDayAssignmentNotificationContent,
} from '../src/domain/rolePreferences.js';

// --- isDayAssignmentMode ---

describe('isDayAssignmentMode', () => {
  it('returns true when vocal_mode is day_assignment', () => {
    expect(isDayAssignmentMode({ vocal_mode: 'day_assignment' })).toBe(true);
  });

  it('returns false when vocal_mode is timeslot', () => {
    expect(isDayAssignmentMode({ vocal_mode: 'timeslot' })).toBe(false);
  });

  it('returns false for null settings', () => {
    expect(isDayAssignmentMode(null)).toBe(false);
  });

  it('returns false for undefined settings', () => {
    expect(isDayAssignmentMode(undefined)).toBe(false);
  });

  it('returns false when vocal_mode is missing', () => {
    expect(isDayAssignmentMode({})).toBe(false);
  });
});

// --- isTimeslotMode ---

describe('isTimeslotMode', () => {
  it('returns true when vocal_mode is timeslot', () => {
    expect(isTimeslotMode({ vocal_mode: 'timeslot' })).toBe(true);
  });

  it('returns false when vocal_mode is day_assignment', () => {
    expect(isTimeslotMode({ vocal_mode: 'day_assignment' })).toBe(false);
  });

  it('returns true for null settings (default)', () => {
    expect(isTimeslotMode(null)).toBe(true);
  });

  it('returns true for undefined settings (default)', () => {
    expect(isTimeslotMode(undefined)).toBe(true);
  });
});

// --- validateRolePreferences ---

describe('validateRolePreferences', () => {
  const roles = [
    { id: 'r1', name: 'Belle' },
    { id: 'r2', name: 'Beast' },
    { id: 'r3', name: 'Ensemble' },
  ];

  it('returns valid for empty preferences (optional)', () => {
    const result = validateRolePreferences([], roles);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid for null preferences', () => {
    const result = validateRolePreferences(null, roles);
    expect(result.valid).toBe(true);
  });

  it('returns valid for well-formed preferences', () => {
    const prefs = [
      { roleId: 'r1', rank: 1 },
      { roleId: 'r2', rank: 2 },
    ];
    const result = validateRolePreferences(prefs, roles);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid role ID', () => {
    const prefs = [{ roleId: 'nonexistent', rank: 1 }];
    const result = validateRolePreferences(prefs, roles);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid role'))).toBe(true);
  });

  it('rejects duplicate roles', () => {
    const prefs = [
      { roleId: 'r1', rank: 1 },
      { roleId: 'r1', rank: 2 },
    ];
    const result = validateRolePreferences(prefs, roles);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate role'))).toBe(true);
  });

  it('rejects duplicate ranks', () => {
    const prefs = [
      { roleId: 'r1', rank: 1 },
      { roleId: 'r2', rank: 1 },
    ];
    const result = validateRolePreferences(prefs, roles);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate rank'))).toBe(true);
  });

  it('rejects non-positive rank', () => {
    const prefs = [{ roleId: 'r1', rank: 0 }];
    const result = validateRolePreferences(prefs, roles);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('positive integer'))).toBe(true);
  });

  it('rejects negative rank', () => {
    const prefs = [{ roleId: 'r1', rank: -1 }];
    const result = validateRolePreferences(prefs, roles);
    expect(result.valid).toBe(false);
  });

  it('rejects non-integer rank', () => {
    const prefs = [{ roleId: 'r1', rank: 1.5 }];
    const result = validateRolePreferences(prefs, roles);
    expect(result.valid).toBe(false);
  });

  it('rejects missing roleId', () => {
    const prefs = [{ rank: 1 }];
    const result = validateRolePreferences(prefs, roles);
    expect(result.valid).toBe(false);
  });
});

// --- sortPreferencesByRank ---

describe('sortPreferencesByRank', () => {
  it('sorts preferences by rank_order ascending', () => {
    const prefs = [
      { rank_order: 3, audition_role_id: 'c' },
      { rank_order: 1, audition_role_id: 'a' },
      { rank_order: 2, audition_role_id: 'b' },
    ];
    const sorted = sortPreferencesByRank(prefs);
    expect(sorted[0].audition_role_id).toBe('a');
    expect(sorted[1].audition_role_id).toBe('b');
    expect(sorted[2].audition_role_id).toBe('c');
  });

  it('does not mutate the original array', () => {
    const prefs = [
      { rank_order: 2, audition_role_id: 'b' },
      { rank_order: 1, audition_role_id: 'a' },
    ];
    sortPreferencesByRank(prefs);
    expect(prefs[0].audition_role_id).toBe('b');
  });

  it('handles empty array', () => {
    expect(sortPreferencesByRank([])).toEqual([]);
  });

  it('handles single item', () => {
    const prefs = [{ rank_order: 1, audition_role_id: 'a' }];
    const sorted = sortPreferencesByRank(prefs);
    expect(sorted).toHaveLength(1);
  });
});

// --- groupStudentsByTopRole ---

describe('groupStudentsByTopRole', () => {
  const roles = [
    { id: 'r1', name: 'Belle' },
    { id: 'r2', name: 'Beast' },
  ];

  it('groups students by their #1 role preference', () => {
    const students = [
      { id: 's1', first_name: 'A', role_preferences: [{ audition_role_id: 'r1', rank_order: 1 }] },
      { id: 's2', first_name: 'B', role_preferences: [{ audition_role_id: 'r2', rank_order: 1 }] },
    ];
    const groups = groupStudentsByTopRole(students, roles);
    expect(groups.get('r1').students).toHaveLength(1);
    expect(groups.get('r2').students).toHaveLength(1);
    expect(groups.get('__none__').students).toHaveLength(0);
  });

  it('uses the lowest rank_order as top preference', () => {
    const students = [
      {
        id: 's1',
        role_preferences: [
          { audition_role_id: 'r2', rank_order: 2 },
          { audition_role_id: 'r1', rank_order: 1 },
        ],
      },
    ];
    const groups = groupStudentsByTopRole(students, roles);
    expect(groups.get('r1').students).toHaveLength(1);
    expect(groups.get('r2').students).toHaveLength(0);
  });

  it('puts students with no preferences in __none__ group', () => {
    const students = [
      { id: 's1', role_preferences: [] },
      { id: 's2' },
    ];
    const groups = groupStudentsByTopRole(students, roles);
    expect(groups.get('__none__').students).toHaveLength(2);
  });

  it('initializes a group for each role', () => {
    const groups = groupStudentsByTopRole([], roles);
    expect(groups.has('r1')).toBe(true);
    expect(groups.has('r2')).toBe(true);
    expect(groups.has('__none__')).toBe(true);
  });

  it('stores role object in each group', () => {
    const groups = groupStudentsByTopRole([], roles);
    expect(groups.get('r1').role.name).toBe('Belle');
    expect(groups.get('__none__').role).toBeNull();
  });
});

// --- groupStudentsByAssignedDate ---

describe('groupStudentsByAssignedDate', () => {
  const configs = [
    { audition_date: '2026-05-01' },
    { audition_date: '2026-05-02' },
  ];

  it('groups students by their assigned audition date', () => {
    const students = [
      { id: 's1', day_assignment: { audition_date: '2026-05-01' } },
      { id: 's2', day_assignment: { audition_date: '2026-05-02' } },
    ];
    const groups = groupStudentsByAssignedDate(students, configs);
    expect(groups.get('2026-05-01').students).toHaveLength(1);
    expect(groups.get('2026-05-02').students).toHaveLength(1);
  });

  it('puts unassigned students in __unassigned__ group', () => {
    const students = [
      { id: 's1', day_assignment: null },
      { id: 's2' },
    ];
    const groups = groupStudentsByAssignedDate(students, configs);
    expect(groups.get('__unassigned__').students).toHaveLength(2);
  });

  it('puts students with unknown dates in __unassigned__ group', () => {
    const students = [
      { id: 's1', day_assignment: { audition_date: '2026-12-31' } },
    ];
    const groups = groupStudentsByAssignedDate(students, configs);
    expect(groups.get('__unassigned__').students).toHaveLength(1);
  });

  it('initializes a group for each config date', () => {
    const groups = groupStudentsByAssignedDate([], configs);
    expect(groups.has('2026-05-01')).toBe(true);
    expect(groups.has('2026-05-02')).toBe(true);
    expect(groups.has('__unassigned__')).toBe(true);
  });
});

// --- generateDayAssignmentNotificationContent ---

describe('generateDayAssignmentNotificationContent', () => {
  const student = {
    first_name: 'Jane',
    last_name: 'Doe',
    parent_first_name: 'Mary',
    parent_email: 'mary@example.com',
  };

  const configs = [
    { audition_date: '2026-05-01', vocal_start_time: '09:00', vocal_end_time: '12:00' },
    { audition_date: '2026-05-02', vocal_start_time: '13:00', vocal_end_time: '16:00' },
  ];

  it('returns subject containing "Vocal Audition"', () => {
    const { subject } = generateDayAssignmentNotificationContent(student, '2026-05-01', configs);
    expect(subject).toContain('Vocal Audition');
  });

  it('returns body containing student name', () => {
    const { body } = generateDayAssignmentNotificationContent(student, '2026-05-01', configs);
    expect(body).toContain('Jane Doe');
  });

  it('returns body containing parent greeting', () => {
    const { body } = generateDayAssignmentNotificationContent(student, '2026-05-01', configs);
    expect(body).toContain('Dear Mary,');
  });

  it('returns body containing formatted assigned date', () => {
    const { body } = generateDayAssignmentNotificationContent(student, '2026-05-01', configs);
    expect(body).toContain('May 1');
  });

  it('handles missing parent_first_name gracefully', () => {
    const noParent = { ...student, parent_first_name: null };
    const { body } = generateDayAssignmentNotificationContent(noParent, '2026-05-01', configs);
    expect(body).toContain('Dear Parent/Guardian,');
  });

  it('shows TBD when config has no vocal times', () => {
    const noTimeConfigs = [{ audition_date: '2026-05-01' }];
    const { body } = generateDayAssignmentNotificationContent(student, '2026-05-01', noTimeConfigs);
    expect(body).toContain('TBD');
  });

  it('returns bodyPreview truncated to 200 chars max', () => {
    const { bodyPreview } = generateDayAssignmentNotificationContent(student, '2026-05-01', configs);
    expect(bodyPreview.length).toBeLessThanOrEqual(201);
  });

  it('handles missing student names gracefully', () => {
    const noName = { parent_first_name: 'Mary' };
    const { body } = generateDayAssignmentNotificationContent(noName, '2026-05-01', configs);
    expect(body).toContain('your student');
  });
});

// --- Structural tests ---

describe('Role preferences migration (structural)', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '00015_vocal_day_assignments.sql'),
    'utf-8',
  );

  it('creates audition_settings table with vocal_mode check', () => {
    expect(migration).toContain('audition_settings');
    expect(migration).toContain("vocal_mode IN ('timeslot', 'day_assignment')");
  });

  it('creates audition_roles table with unique name index', () => {
    expect(migration).toContain('audition_roles');
    expect(migration).toContain('audition_roles_name_idx');
  });

  it('creates student_role_preferences table with unique indexes', () => {
    expect(migration).toContain('student_role_preferences');
    expect(migration).toContain('student_role_prefs_student_role_idx');
    expect(migration).toContain('student_role_prefs_student_rank_idx');
  });

  it('creates vocal_day_assignments table with unique student index', () => {
    expect(migration).toContain('vocal_day_assignments');
    expect(migration).toContain('vocal_day_assignments_student_idx');
  });

  it('enables RLS on all new tables', () => {
    expect(migration).toMatch(/audition_settings.*ENABLE ROW LEVEL SECURITY/s);
    expect(migration).toMatch(/audition_roles.*ENABLE ROW LEVEL SECURITY/s);
    expect(migration).toMatch(/student_role_preferences.*ENABLE ROW LEVEL SECURITY/s);
    expect(migration).toMatch(/vocal_day_assignments.*ENABLE ROW LEVEL SECURITY/s);
  });

  it('assign_vocal_day RPC is SECURITY DEFINER', () => {
    const fnStart = migration.indexOf('assign_vocal_day');
    expect(fnStart).toBeGreaterThan(-1);
    const fnBody = migration.slice(fnStart);
    expect(fnBody).toContain('SECURITY DEFINER');
  });

  it('unassign_vocal_day RPC is SECURITY DEFINER', () => {
    const fnStart = migration.indexOf('unassign_vocal_day');
    expect(fnStart).toBeGreaterThan(-1);
    const fnBody = migration.slice(fnStart);
    expect(fnBody).toContain('SECURITY DEFINER');
  });

  it('assign RPC logs audit entry', () => {
    expect(migration).toContain("log_admin_audit");
    expect(migration).toContain("'assign_vocal_day'");
  });

  it('unassign RPC logs audit entry', () => {
    expect(migration).toContain("'unassign_vocal_day'");
  });

  it('families can CRUD own role preferences', () => {
    expect(migration).toContain('Families can read own role preferences');
    expect(migration).toContain('Families can create own role preferences');
    expect(migration).toContain('Families can update own role preferences');
    expect(migration).toContain('Families can delete own role preferences');
  });

  it('staff can read all role preferences', () => {
    expect(migration).toContain('Staff can read all role preferences');
  });

  it('only admins can delete audition roles', () => {
    expect(migration).toContain('Admins can delete audition roles');
    expect(migration).toMatch(/audition_roles.*FOR DELETE.*role = 'admin'/s);
  });

  it('seeds default audition_settings row with timeslot mode', () => {
    expect(migration).toContain("INSERT INTO public.audition_settings (vocal_mode) VALUES ('timeslot')");
  });
});

describe('Role preferences adapter (structural)', () => {
  const adapter = readFileSync(
    join(process.cwd(), 'src', 'adapters', 'rolePreferences.js'),
    'utf-8',
  );

  it('uses RPCs for day assignment mutations', () => {
    expect(adapter).toContain("rpc('assign_vocal_day'");
    expect(adapter).toContain("rpc('unassign_vocal_day'");
  });

  it('imports supabase client', () => {
    expect(adapter).toContain("from './supabase.js'");
  });

  it('uses atomic save for role preferences (delete then insert)', () => {
    expect(adapter).toContain('.delete()');
    expect(adapter).toContain('.insert(rows)');
  });
});

describe('Domain re-exports (structural)', () => {
  const domainIndex = readFileSync(
    join(process.cwd(), 'src', 'domain', 'index.js'),
    'utf-8',
  );

  it('re-exports rolePreferences module', () => {
    expect(domainIndex).toContain("from './rolePreferences.js'");
  });
});

describe('Route registration (structural)', () => {
  const mainContent = readFileSync(
    join(process.cwd(), 'src', 'main.js'),
    'utf-8',
  );

  it('registers /staff/roles route', () => {
    expect(mainContent).toContain("'/staff/roles'");
  });

  it('registers /staff/vocal-assignments route', () => {
    expect(mainContent).toContain("'/staff/vocal-assignments'");
  });

  it('imports staffRoleConfig page', () => {
    expect(mainContent).toContain('staffRoleConfig');
  });

  it('imports staffVocalAssignments page', () => {
    expect(mainContent).toContain('staffVocalAssignments');
  });
});

describe('Staff sidebar links (structural)', () => {
  const layoutContent = readFileSync(
    join(process.cwd(), 'src', 'ui', 'layouts.js'),
    'utf-8',
  );

  it('has Audition Roles sidebar link', () => {
    expect(layoutContent).toContain('#/staff/roles');
    expect(layoutContent).toContain('Audition Roles');
  });

  it('has Vocal Assignments sidebar link', () => {
    expect(layoutContent).toContain('#/staff/vocal-assignments');
    expect(layoutContent).toContain('Vocal Assignments');
  });
});

describe('Vocal booking page mode awareness (structural)', () => {
  const vocalPage = readFileSync(
    join(process.cwd(), 'src', 'pages', 'familyVocalBooking.js'),
    'utf-8',
  );

  it('imports audition settings fetcher', () => {
    expect(vocalPage).toContain('fetchAuditionSettings');
  });

  it('imports isDayAssignmentMode', () => {
    expect(vocalPage).toContain('isDayAssignmentMode');
  });

  it('imports fetchVocalDayAssignmentForStudent', () => {
    expect(vocalPage).toContain('fetchVocalDayAssignmentForStudent');
  });

  it('checks day assignment mode before rendering', () => {
    expect(vocalPage).toContain('isDayAssignmentMode(settings)');
  });
});

describe('Family schedule day assignment awareness (structural)', () => {
  const schedulePage = readFileSync(
    join(process.cwd(), 'src', 'pages', 'familySchedule.js'),
    'utf-8',
  );

  it('imports audition settings', () => {
    expect(schedulePage).toContain('fetchAuditionSettings');
  });

  it('imports day assignment fetcher', () => {
    expect(schedulePage).toContain('fetchVocalDayAssignmentForStudent');
  });

  it('checks day assignment mode', () => {
    expect(schedulePage).toContain('isDayAssignmentMode');
  });
});

describe('Staff vocal roster mode banner (structural)', () => {
  const rosterPage = readFileSync(
    join(process.cwd(), 'src', 'pages', 'staffVocalRoster.js'),
    'utf-8',
  );

  it('imports audition settings', () => {
    expect(rosterPage).toContain('fetchAuditionSettings');
  });

  it('checks day assignment mode', () => {
    expect(rosterPage).toContain('isDayAssignmentMode');
  });

  it('links to vocal assignments page', () => {
    expect(rosterPage).toContain('#/staff/vocal-assignments');
  });
});

describe('Registration role preferences step (structural)', () => {
  const regPage = readFileSync(
    join(process.cwd(), 'src', 'pages', 'familyRegistration.js'),
    'utf-8',
  );

  it('imports role preferences adapters', () => {
    expect(regPage).toContain('fetchAuditionRoles');
    expect(regPage).toContain('saveRolePreferences');
  });

  it('imports isDayAssignmentMode', () => {
    expect(regPage).toContain('isDayAssignmentMode');
  });

  it('has dynamic step names including Role Preferences', () => {
    expect(regPage).toContain("'Role Preferences'");
  });

  it('renders role rank selectors', () => {
    expect(regPage).toContain('role-rank-select');
  });

  it('has skip button for role preferences', () => {
    expect(regPage).toContain('skip-role-prefs-btn');
  });

  it('has Audition Song step in wizard', () => {
    expect(regPage).toContain("'Audition Song'");
  });

  it('has student email field', () => {
    expect(regPage).toContain('reg-student-email');
  });

  it('has parent2 fields', () => {
    expect(regPage).toContain('reg-parent2-first');
    expect(regPage).toContain('reg-parent2-last');
    expect(regPage).toContain('reg-parent2-email');
    expect(regPage).toContain('reg-parent2-phone');
  });

  it('has song form fields', () => {
    expect(regPage).toContain('song-form');
    expect(regPage).toContain('sings-own');
    expect(regPage).toContain('reg-song-name');
  });

  it('imports validateSongChoice', () => {
    expect(regPage).toContain('validateSongChoice');
  });
});

describe('Staff dashboard quick links (structural)', () => {
  const dashboard = readFileSync(
    join(process.cwd(), 'src', 'pages', 'staffDashboard.js'),
    'utf-8',
  );

  it('has Audition Roles quick action', () => {
    expect(dashboard).toContain('#/staff/roles');
    expect(dashboard).toContain('Audition Roles');
  });

  it('has Vocal Assignments quick action', () => {
    expect(dashboard).toContain('#/staff/vocal-assignments');
    expect(dashboard).toContain('Vocal Assignments');
  });
});
