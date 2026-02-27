import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  isCallbackInvited,
  getCallbackVisibility,
  generateCallbackNotificationContent,
  validateNotificationRecipient,
} from '../src/domain/callbacks.js';

// --- isCallbackInvited ---

describe('isCallbackInvited', () => {
  it('returns true when callback_invited is true', () => {
    expect(isCallbackInvited({ callback_invited: true })).toBe(true);
  });

  it('returns false when callback_invited is false', () => {
    expect(isCallbackInvited({ callback_invited: false })).toBe(false);
  });

  it('returns false when callback_invited is undefined', () => {
    expect(isCallbackInvited({})).toBe(false);
  });

  it('returns false for null student', () => {
    expect(isCallbackInvited(null)).toBe(false);
  });
});

// --- getCallbackVisibility ---

describe('getCallbackVisibility', () => {
  const configsWithCallbacks = [
    { audition_date: '2026-05-01', callback_start_time: '15:00', callback_end_time: '17:00' },
    { audition_date: '2026-05-02', callback_start_time: null, callback_end_time: null },
  ];

  it('returns visible=false for uninvited student', () => {
    const result = getCallbackVisibility({ callback_invited: false }, configsWithCallbacks);
    expect(result.visible).toBe(false);
    expect(result.windows).toHaveLength(0);
    expect(result.message).toContain('not been invited');
  });

  it('returns visible=true for invited student with callback configs', () => {
    const result = getCallbackVisibility({ callback_invited: true }, configsWithCallbacks);
    expect(result.visible).toBe(true);
    expect(result.windows).toHaveLength(1); // only 1 config has callback times
    expect(result.windows[0].date).toBe('2026-05-01');
  });

  it('filters configs to only those with callback times', () => {
    const result = getCallbackVisibility({ callback_invited: true }, configsWithCallbacks);
    expect(result.windows).toHaveLength(1);
    expect(result.windows[0].start).toBe('15:00');
    expect(result.windows[0].end).toBe('17:00');
  });

  it('returns visible=false for null student', () => {
    const result = getCallbackVisibility(null, configsWithCallbacks);
    expect(result.visible).toBe(false);
  });

  it('returns visible=true but empty windows when no callback times configured', () => {
    const noCallbackConfigs = [
      { audition_date: '2026-05-01', callback_start_time: null, callback_end_time: null },
    ];
    const result = getCallbackVisibility({ callback_invited: true }, noCallbackConfigs);
    expect(result.visible).toBe(true);
    expect(result.windows).toHaveLength(0);
  });

  it('handles null configs array', () => {
    const result = getCallbackVisibility({ callback_invited: true }, null);
    expect(result.visible).toBe(true);
    expect(result.windows).toHaveLength(0);
  });
});

// --- generateCallbackNotificationContent ---

describe('generateCallbackNotificationContent', () => {
  const student = {
    first_name: 'Jane',
    last_name: 'Doe',
    parent_first_name: 'Mary',
    parent_email: 'mary@example.com',
  };

  const configs = [
    { audition_date: '2026-05-01', callback_start_time: '15:00', callback_end_time: '17:00' },
  ];

  it('returns subject containing "Callback"', () => {
    const { subject } = generateCallbackNotificationContent(student, configs);
    expect(subject).toContain('Callback');
  });

  it('returns body containing student name', () => {
    const { body } = generateCallbackNotificationContent(student, configs);
    expect(body).toContain('Jane Doe');
  });

  it('returns body containing parent greeting', () => {
    const { body } = generateCallbackNotificationContent(student, configs);
    expect(body).toContain('Dear Mary,');
  });

  it('returns body containing callback date and times', () => {
    const { body } = generateCallbackNotificationContent(student, configs);
    expect(body).toContain('2026-05-01');
  });

  it('returns bodyPreview that is truncated for long content', () => {
    const longConfigs = Array.from({ length: 20 }, (_, i) => ({
      audition_date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      callback_start_time: '15:00',
      callback_end_time: '17:00',
    }));
    const { bodyPreview } = generateCallbackNotificationContent(student, longConfigs);
    expect(bodyPreview.length).toBeLessThanOrEqual(201);
  });

  it('handles missing parent_first_name gracefully', () => {
    const noParentName = { ...student, parent_first_name: null };
    const { body } = generateCallbackNotificationContent(noParentName, configs);
    expect(body).toContain('Dear Parent/Guardian,');
  });

  it('handles empty configs gracefully', () => {
    const { body } = generateCallbackNotificationContent(student, []);
    expect(body).toContain('announced soon');
  });
});

// --- validateNotificationRecipient ---

describe('validateNotificationRecipient', () => {
  it('returns valid=true when parent_email exists', () => {
    const result = validateNotificationRecipient({ parent_email: 'test@example.com' });
    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('returns valid=false when parent_email is missing', () => {
    const result = validateNotificationRecipient({});
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('email');
  });

  it('returns valid=false when parent_email is null', () => {
    const result = validateNotificationRecipient({ parent_email: null });
    expect(result.valid).toBe(false);
  });

  it('returns valid=false when parent_email is empty string', () => {
    const result = validateNotificationRecipient({ parent_email: '' });
    expect(result.valid).toBe(false);
  });

  it('returns valid=false when parent_email is whitespace only', () => {
    const result = validateNotificationRecipient({ parent_email: '   ' });
    expect(result.valid).toBe(false);
  });

  it('returns valid=false for null student', () => {
    const result = validateNotificationRecipient(null);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });
});

// --- Structural / authorization tests ---

describe('Callback authorization (structural)', () => {
  it('staff callbacks page is under /staff route prefix', () => {
    const mainContent = readFileSync(
      join(process.cwd(), 'src', 'main.js'),
      'utf-8',
    );
    expect(mainContent).toContain("'/staff/callbacks'");
  });

  it('no /family/callbacks route exists (callbacks shown on schedule page)', () => {
    const mainContent = readFileSync(
      join(process.cwd(), 'src', 'main.js'),
      'utf-8',
    );
    expect(mainContent).not.toContain("'/family/callbacks'");
  });

  it('callbacks adapter uses RPC for invite toggle (not direct table update)', () => {
    const adapterContent = readFileSync(
      join(process.cwd(), 'src', 'adapters', 'callbacks.js'),
      'utf-8',
    );
    expect(adapterContent).toContain("rpc('toggle_callback_invite'");
    expect(adapterContent).toContain("rpc('log_notification_send'");
  });

  it('callbacks adapter does NOT contain booking RPCs', () => {
    const adapterContent = readFileSync(
      join(process.cwd(), 'src', 'adapters', 'callbacks.js'),
      'utf-8',
    );
    expect(adapterContent).not.toContain("rpc('book_callback");
    expect(adapterContent).not.toContain('callback_bookings');
    expect(adapterContent).not.toContain('callback_signups');
  });
});

describe('No callback booking tables (structural)', () => {
  it('no callback_bookings or callback_signups table exists in any migration', () => {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

    files.forEach((file) => {
      const content = readFileSync(join(migrationsDir, file), 'utf-8');
      expect(content).not.toContain('callback_bookings');
      expect(content).not.toContain('callback_signups');
    });
  });
});

describe('Callback invite RPC (structural)', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '00010_callback_notifications.sql'),
    'utf-8',
  );

  it('toggle_callback_invite RPC exists', () => {
    expect(migration).toContain('toggle_callback_invite');
  });

  it('toggle RPC checks staff_profiles', () => {
    expect(migration).toContain('staff_profiles');
  });

  it('toggle RPC updates callback_invited', () => {
    expect(migration).toContain('callback_invited = p_invited');
  });

  it('toggle RPC sets audit fields', () => {
    expect(migration).toContain('updated_by_user_id');
    expect(migration).toContain('updated_at');
  });

  it('notification_sends table exists', () => {
    expect(migration).toContain('notification_sends');
  });

  it('notification_sends is append-only (no UPDATE/DELETE policies)', () => {
    // Verify no update or delete policy on notification_sends
    expect(migration).not.toMatch(/notification_sends.*for update/i);
    expect(migration).not.toMatch(/notification_sends.*for delete/i);
  });

  it('log_notification_send RPC exists and checks staff', () => {
    const logFnStart = migration.indexOf('log_notification_send');
    expect(logFnStart).toBeGreaterThan(-1);
    const logFnBody = migration.slice(logFnStart);
    expect(logFnBody).toContain('staff_profiles');
  });
});

describe('Family schedule callback gating (structural)', () => {
  const scheduleContent = readFileSync(
    join(process.cwd(), 'src', 'pages', 'familySchedule.js'),
    'utf-8',
  );

  it('imports callback gating logic from domain', () => {
    expect(scheduleContent).toContain('isCallbackInvited');
    expect(scheduleContent).toContain('../domain/callbacks.js');
  });

  it('gates callback display on invite status', () => {
    expect(scheduleContent).toContain('anyInvited');
  });

  it('does NOT unconditionally render callback times', () => {
    // The old pattern was: c.callback_start_time ? ... Callbacks ...
    // The new pattern is: anyInvited && c.callback_start_time ? ...
    expect(scheduleContent).toContain('anyInvited && c.callback_start_time');
  });
});
