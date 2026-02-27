import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createSubmitGuard, DEFAULT_COOLDOWN_MS } from '../src/ui/rateLimiting.js';

const root = process.cwd();

// Helper: concatenate all migration SQL
function allMigrationSql() {
  const dir = join(root, 'supabase/migrations');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => readFileSync(join(dir, f), 'utf-8'))
    .join('\n');
}

// --- Audit Field Completeness ---

describe('Audit field completeness (structural)', () => {
  const migration12 = readFileSync(join(root, 'supabase/migrations/00012_audit_field_backfill.sql'), 'utf-8');
  const migration08 = readFileSync(join(root, 'supabase/migrations/00008_dance_sessions_and_signups.sql'), 'utf-8');
  const migration09 = readFileSync(join(root, 'supabase/migrations/00009_vocal_slots_and_bookings.sql'), 'utf-8');
  const migration03 = readFileSync(join(root, 'supabase/migrations/00003_students.sql'), 'utf-8');

  it('audition_window_config gets created_by_staff_user_id', () => {
    expect(migration12).toContain('created_by_staff_user_id');
    expect(migration12).toContain('audition_window_config');
  });

  it('dance_sessions gets updated_by_staff_user_id', () => {
    expect(migration12).toContain('updated_by_staff_user_id');
    expect(migration12).toContain('dance_sessions');
  });

  it('audition_slots gets updated_by_staff_user_id', () => {
    expect(migration12).toContain('audition_slots');
  });

  it('students table has all four audit fields', () => {
    expect(migration03).toContain('created_at');
    expect(migration03).toContain('updated_at');
    expect(migration03).toContain('created_by_user_id');
    expect(migration03).toContain('updated_by_user_id');
  });

  it('dance_signups has all four audit fields', () => {
    expect(migration08).toContain('created_at');
    expect(migration08).toContain('updated_at');
    expect(migration08).toContain('created_by_user_id');
    expect(migration08).toContain('updated_by_user_id');
  });

  it('vocal_bookings has all four audit fields', () => {
    expect(migration09).toContain('created_at');
    expect(migration09).toContain('updated_at');
    expect(migration09).toContain('created_by_user_id');
    expect(migration09).toContain('updated_by_user_id');
  });

  it('contracts table is immutable (created_at + created_by only)', () => {
    const migration02 = readFileSync(join(root, 'supabase/migrations/00002_contracts.sql'), 'utf-8');
    expect(migration02).toContain('created_at');
    expect(migration02).toContain('created_by_staff_user_id');
  });

  it('notification_sends is append-only (created_at + sent_by only)', () => {
    const migration10 = readFileSync(join(root, 'supabase/migrations/00010_callback_notifications.sql'), 'utf-8');
    expect(migration10).toContain('created_at');
    expect(migration10).toContain('sent_by_user_id');
  });
});

// --- Admin Audit Log Table ---

describe('Admin audit log table (structural)', () => {
  const migration13 = readFileSync(join(root, 'supabase/migrations/00013_admin_audit_log.sql'), 'utf-8');

  it('creates admin_audit_log table', () => {
    expect(migration13).toContain('create table if not exists public.admin_audit_log');
  });

  it('table has required columns', () => {
    expect(migration13).toContain('action text not null');
    expect(migration13).toContain('actor_id uuid not null');
    expect(migration13).toContain('table_name text not null');
    expect(migration13).toContain('record_id uuid');
    expect(migration13).toContain('details jsonb');
    expect(migration13).toContain('created_at timestamptz');
  });

  it('has RLS enabled', () => {
    expect(migration13).toContain('enable row level security');
  });

  it('staff can read audit log', () => {
    expect(migration13).toContain('Staff can read audit log');
  });

  it('log_admin_audit RPC exists as SECURITY DEFINER', () => {
    expect(migration13).toContain('function public.log_admin_audit');
    expect(migration13).toContain('security definer');
  });

  it('admin_update_dance_signup calls log_admin_audit', () => {
    const fnStart = migration13.indexOf('function public.admin_update_dance_signup');
    const fnBody = migration13.slice(fnStart, migration13.indexOf('$$;', fnStart));
    expect(fnBody).toContain('log_admin_audit');
  });

  it('admin_override_vocal_booking calls log_admin_audit', () => {
    const fnStart = migration13.indexOf('function public.admin_override_vocal_booking');
    const fnBody = migration13.slice(fnStart, migration13.indexOf('$$;', fnStart));
    expect(fnBody).toContain('log_admin_audit');
  });

  it('toggle_callback_invite calls log_admin_audit', () => {
    const fnStart = migration13.indexOf('function public.toggle_callback_invite');
    const fnBody = migration13.slice(fnStart, migration13.indexOf('$$;', fnStart));
    expect(fnBody).toContain('log_admin_audit');
  });

  it('activate_contract RPC exists and calls log_admin_audit', () => {
    expect(migration13).toContain('function public.activate_contract');
    const fnStart = migration13.indexOf('function public.activate_contract');
    const fnBody = migration13.slice(fnStart, migration13.indexOf('$$;', fnStart));
    expect(fnBody).toContain('log_admin_audit');
  });

  it('activate_contract is admin-only', () => {
    const fnStart = migration13.indexOf('function public.activate_contract');
    const fnBody = migration13.slice(fnStart, migration13.indexOf('$$;', fnStart));
    expect(fnBody).toContain("role = 'admin'");
  });
});

// --- RLS Regression: All Tables Have RLS Enabled ---

describe('RLS regression — all tables have RLS enabled', () => {
  const sql = allMigrationSql().toLowerCase();

  const tables = [
    'staff_profiles',
    'contracts',
    'students',
    'contract_acceptances',
    'audition_window_config',
    'dance_sessions',
    'dance_signups',
    'audition_slots',
    'vocal_bookings',
    'notification_sends',
    'student_evaluations',
    'admin_audit_log',
  ];

  tables.forEach((table) => {
    it(`${table} has RLS enabled`, () => {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    });
  });
});

// --- RLS Regression: Family Isolation ---

describe('RLS regression — family isolation', () => {
  it('students table has family_account_id ownership check', () => {
    const m = readFileSync(join(root, 'supabase/migrations/00003_students.sql'), 'utf-8');
    expect(m).toContain('family_account_id = auth.uid()');
  });

  it('dance_signups family SELECT checks student ownership', () => {
    const m = readFileSync(join(root, 'supabase/migrations/00008_dance_sessions_and_signups.sql'), 'utf-8');
    expect(m).toContain('students.family_account_id = auth.uid()');
  });

  it('vocal_bookings family SELECT checks student ownership', () => {
    const m = readFileSync(join(root, 'supabase/migrations/00009_vocal_slots_and_bookings.sql'), 'utf-8');
    expect(m).toContain('students.family_account_id = auth.uid()');
  });

  it('contract_acceptances family SELECT checks student ownership', () => {
    const m = readFileSync(join(root, 'supabase/migrations/00004_contract_acceptances.sql'), 'utf-8');
    expect(m).toContain('students.family_account_id = auth.uid()');
  });

  it('storage policies enforce folder ownership', () => {
    const m = readFileSync(join(root, 'supabase/migrations/00005_storage_policies.sql'), 'utf-8');
    expect(m).toContain('auth.uid()');
  });
});

// --- RLS Regression: Staff-Only Protection ---

describe('RLS regression — staff-only protection', () => {
  it('notification_sends is staff-only (no family_account_id in policies)', () => {
    const m = readFileSync(join(root, 'supabase/migrations/00010_callback_notifications.sql'), 'utf-8');
    expect(m).toContain('staff_profiles');
    // Verify no family access policy
    const notificationSection = m.slice(m.indexOf('notification_sends'));
    expect(notificationSection).not.toContain('family_account_id');
  });

  it('student_evaluations is staff-only', () => {
    const m = readFileSync(join(root, 'supabase/migrations/00011_student_evaluations.sql'), 'utf-8');
    expect(m).toContain('staff_profiles');
    expect(m).not.toContain('family_account_id');
  });

  it('admin_audit_log is staff-only', () => {
    const m = readFileSync(join(root, 'supabase/migrations/00013_admin_audit_log.sql'), 'utf-8');
    expect(m).toContain('staff_profiles');
    expect(m).not.toContain('family_account_id');
  });
});

// --- Booking RPC Regression ---

describe('Booking RPC regression — dance', () => {
  const m = readFileSync(join(root, 'supabase/migrations/00008_dance_sessions_and_signups.sql'), 'utf-8');

  it('upsert_dance_signup checks student ownership', () => {
    expect(m).toContain('v_family_id != auth.uid()');
  });

  it('upsert_dance_signup checks registration_complete', () => {
    expect(m).toContain('registration_complete');
  });

  it('upsert_dance_signup enforces lock time 14:00', () => {
    expect(m).toContain('14:00:00');
  });

  it('uniqueness constraint on student_id', () => {
    expect(m).toContain('dance_signups_student_idx');
  });
});

describe('Booking RPC regression — vocal', () => {
  const m = readFileSync(join(root, 'supabase/migrations/00009_vocal_slots_and_bookings.sql'), 'utf-8');

  it('book_vocal_slot uses SELECT FOR UPDATE', () => {
    expect(m).toContain('for update');
  });

  it('capacity enforced at 7', () => {
    expect(m).toContain('>= 7');
  });

  it('reschedule_vocal_slot exists for atomic move', () => {
    expect(m).toContain('reschedule_vocal_slot');
  });

  it('uniqueness constraint on student_id', () => {
    expect(m).toContain('vocal_bookings_student_idx');
  });
});

// --- Rate Limiting Utility ---

describe('createSubmitGuard', () => {
  it('exports DEFAULT_COOLDOWN_MS as 1000', () => {
    expect(DEFAULT_COOLDOWN_MS).toBe(1000);
  });

  it('calls the wrapped function on first invocation', async () => {
    let callCount = 0;
    const guarded = createSubmitGuard(async () => { callCount++; }, 0);
    await guarded();
    expect(callCount).toBe(1);
  });

  it('blocks concurrent calls while in-flight', async () => {
    let callCount = 0;
    let resolve;
    const guarded = createSubmitGuard(async () => {
      callCount++;
      await new Promise((r) => { resolve = r; });
    }, 0);
    const p = guarded(); // starts in-flight
    guarded(); // should be blocked
    resolve();
    await p;
    expect(callCount).toBe(1);
  });

  it('blocks calls within cooldown period', async () => {
    let callCount = 0;
    const guarded = createSubmitGuard(async () => { callCount++; }, 5000);
    await guarded();
    await guarded(); // within cooldown
    expect(callCount).toBe(1);
  });

  it('returns the function result', async () => {
    const guarded = createSubmitGuard(async () => 42, 0);
    const result = await guarded();
    expect(result).toBe(42);
  });

  it('allows calls after cooldown expires', async () => {
    let callCount = 0;
    const guarded = createSubmitGuard(async () => { callCount++; }, 1);
    await guarded();
    await new Promise((r) => setTimeout(r, 10)); // wait past cooldown
    await guarded();
    expect(callCount).toBe(2);
  });
});

// --- Audit Log Adapter (structural) ---

describe('Audit log adapter (structural)', () => {
  const adapter = readFileSync(join(root, 'src/adapters/auditLog.js'), 'utf-8');

  it('exports logAuditEntry function', () => {
    expect(adapter).toContain('export async function logAuditEntry');
  });

  it('exports fetchAuditLog function', () => {
    expect(adapter).toContain('export async function fetchAuditLog');
  });

  it('calls log_admin_audit RPC', () => {
    expect(adapter).toContain("rpc('log_admin_audit'");
  });

  it('returns {data, error} shape', () => {
    expect(adapter).toContain('return { data');
  });
});

// --- Contract Activation via RPC (structural) ---

describe('Contract activation via RPC (structural)', () => {
  const adapter = readFileSync(join(root, 'src/adapters/contracts.js'), 'utf-8');

  it('setActiveContract calls activate_contract RPC', () => {
    expect(adapter).toContain("rpc('activate_contract'");
  });

  it('no longer does two-step deactivate/activate', () => {
    expect(adapter).not.toContain("update({ is_active: false })");
    expect(adapter).not.toContain("update({ is_active: true })");
  });
});

// --- Rate Limiting Applied to Export Pages (structural) ---

describe('Rate limiting on export pages (structural)', () => {
  const danceRoster = readFileSync(join(root, 'src/pages/staffDanceRoster.js'), 'utf-8');
  const vocalRoster = readFileSync(join(root, 'src/pages/staffVocalRoster.js'), 'utf-8');
  const callbacksPage = readFileSync(join(root, 'src/pages/staffCallbacks.js'), 'utf-8');

  it('dance roster imports createSubmitGuard', () => {
    expect(danceRoster).toContain('createSubmitGuard');
    expect(danceRoster).toContain("from '../ui/rateLimiting.js'");
  });

  it('vocal roster imports createSubmitGuard', () => {
    expect(vocalRoster).toContain('createSubmitGuard');
    expect(vocalRoster).toContain("from '../ui/rateLimiting.js'");
  });

  it('callbacks page imports createSubmitGuard', () => {
    expect(callbacksPage).toContain('createSubmitGuard');
    expect(callbacksPage).toContain("from '../ui/rateLimiting.js'");
  });
});

// --- Audit Logging on Config/Contract Pages (structural) ---

describe('Audit logging on admin pages (structural)', () => {
  const scheduling = readFileSync(join(root, 'src/pages/staffScheduling.js'), 'utf-8');
  const contracts = readFileSync(join(root, 'src/pages/adminContracts.js'), 'utf-8');

  it('staffScheduling imports logAuditEntry', () => {
    expect(scheduling).toContain('logAuditEntry');
    expect(scheduling).toContain("from '../adapters/auditLog.js'");
  });

  it('staffScheduling logs create_config', () => {
    expect(scheduling).toContain("'create_config'");
  });

  it('staffScheduling logs update_config', () => {
    expect(scheduling).toContain("'update_config'");
  });

  it('adminContracts imports logAuditEntry', () => {
    expect(contracts).toContain('logAuditEntry');
    expect(contracts).toContain("from '../adapters/auditLog.js'");
  });

  it('adminContracts logs create_contract', () => {
    expect(contracts).toContain("'create_contract'");
  });
});

// --- Scheduling Adapter Audit Field (structural) ---

describe('Scheduling adapter sets created_by (structural)', () => {
  const adapter = readFileSync(join(root, 'src/adapters/scheduling.js'), 'utf-8');

  it('createConfig sets created_by_staff_user_id', () => {
    expect(adapter).toContain('created_by_staff_user_id');
  });
});
