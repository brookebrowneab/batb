# Data Architecture — Conceptual Model (Supabase)

## Conceptual Entities (No SQL)

### Student
**Required fields**
- id
- family_account_id (owner)
- first_name, last_name, grade (and other required registration fields)
- photo_storage_path (required)
- registration_complete (bool)
- callback_invited (bool)
- created_at, updated_at
- created_by_user_id, updated_by_user_id (recommended)

**Relationships**
- Student 1—* ContractAcceptance
- Student 1—* Booking (Dance + Vocal)
- Student 1—* Evaluation (optional)

**Key constraints**
- Ownership: student belongs to exactly one family account.
- Registration completeness is derived from required fields + photo + acceptance (enforced by logic + validations).
- Callback invite controls visibility of callback content (not bookings).

**Audit requirements**
- timestamps and editor attribution for staff/admin edits.
- preserve historical acceptances; avoid destructive updates.

---

### Contract (Versioned)
**Required fields**
- id
- version_number (monotonic)
- text_snapshot (immutable once published)
- is_active (only one active)
- created_at
- created_by_staff_user_id

**Relationships**
- Contract 1—* ContractAcceptance

**Key constraints**
- Only one active contract at any time.
- Contract text snapshot must not be edited after publish; new version instead.

**Audit requirements**
- record activation changes and actor.

---

### ContractAcceptance
**Required fields**
- id
- student_id
- contract_id (version)
- student_typed_signature, student_signed_at
- parent_typed_signature, parent_signed_at
- signed_by_user_id (family auth user)
- created_at

**Relationships**
- belongs to Student
- belongs to Contract

**Key constraints**
- One acceptance per (student_id, contract_id) (unless you explicitly allow re-sign of same version; default: disallow).
- Acceptance history preserved forever.

**Audit requirements**
- immutable acceptance record.

---

### AuditionWindowConfig (Director-editable scheduling config)
Represents the director-controlled calendar/time settings.

**Required fields**
- id
- audition_dates[] (or separate rows per date)
- dance_start_time, dance_end_time (per date, if needed)
- vocal_start_time, vocal_end_time (per date, if needed)
- callback_start_time, callback_end_time (per date, if needed)
- lock_time_rule: fixed at 2:00 PM day-of (store as policy config for transparency)
- created_at, updated_at
- updated_by_staff_user_id

**Relationships**
- used to generate DanceSessions and Vocal AuditionSlots (admin/staff action)

**Key constraints**
- start_time < end_time for each configured window.
- changes after bookings exist require audit + notification policy (recommended).

**Audit requirements**
- record all config edits and actor.

---

### DanceSession
**Required fields**
- id
- date
- start_time, end_time
- capacity (nullable = unlimited)
- created_at, updated_at

**Relationships**
- DanceSession 1—* Booking (track='Dance')

**Key constraints**
- Student may have at most one Dance booking.
- If capacity set: enforce not exceeding capacity transactionally.

**Audit requirements**
- track edits; if capacity lowered below existing bookings, require admin resolution.

---

### AuditionSlot (Vocal only)
**Required fields**
- id
- date
- start_time, end_time (15 minutes)
- capacity (default 7)
- created_at, updated_at

**Relationships**
- AuditionSlot 1—* Booking (track='Vocal')

**Key constraints**
- duration exactly 15 minutes.
- capacity >= 1.
- unique(date, start_time) for Vocal recommended.

**Audit requirements**
- preserve slot edit history; changing times with bookings requires admin workflow.

---

### Booking
Represents a student reserving Dance attendance or a Vocal slot.

**Required fields**
- id
- student_id
- track enum: 'Dance' | 'Vocal'
- dance_session_id (required when track='Dance')
- audition_slot_id (required when track='Vocal')
- created_at, updated_at
- created_by_user_id, updated_by_user_id
- cancelled_at (optional) + cancelled_by (recommended for soft-cancel)

**Relationships**
- belongs to Student
- belongs to DanceSession OR AuditionSlot

**Key constraints**
- Unique(student_id, track='Vocal') — exactly one Vocal booking per student.
- Unique(student_id, track='Dance') — exactly one Dance sign-up per student.
- Capacity enforcement:
  - Vocal: bookings per slot <= capacity (transactional RPC).
  - Dance: bookings per session <= capacity if capacity not null (transactional RPC).

**Audit requirements**
- keep history (soft cancel preferred) for dispute resolution.

---

### Evaluation (Optional)
**Required fields**
- id
- student_id
- staff_user_id
- track context: 'Dance' | 'Vocal' | 'Callbacks'
- notes / rubric fields
- created_at, updated_at

**Constraints**
- directors edit only their own evaluations; admin override allowed.

**Audit requirements**
- track edits; optional versioning.

---

### StaffUser / Profile
**Required fields**
- auth_user_id
- role: 'admin' | 'director'
- display_name, email
- created_at, updated_at

**Constraints**
- role must be enforced by RLS; director scheduling-config edit permission is explicit.

**Audit requirements**
- role change log.

---

## Derived Views (Conceptual)
- **Roster View (Vocal):** join Student + Booking + AuditionSlot; grouped by slot.
- **Roster View (Dance):** join Student + Booking + DanceSession; grouped by session/date.
- **Callbacks Invited List:** Student where callback_invited=true plus Callback window config metadata.

## Data Retention Notes
- Contract versions and acceptances should be retained at least through the production cycle; recommended retention is multi-year for auditability.