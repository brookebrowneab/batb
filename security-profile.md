# Security Profile — Supabase + Static Frontend

## Security Goals
- No public roster or unauthorized access to student data/photos.
- Families can access only their own student record(s).
- Staff-only access to rosters, exports, and audition packs.
- Prevent overbooking (cannot take the 7th vocal seat concurrently).
- Preserve contract acceptance history tied to contract versions.
- Audit admin/staff edits and overrides.

## Threat Model (Practical)
Primary risks:
1. Unauthorized data access via misconfigured RLS.
2. Photo exposure via public buckets/guessable URLs.
3. Overbooking due to race conditions.
4. Privilege escalation (director acting as admin).
5. Accidental roster sharing (exports/links).
6. Data integrity loss (editing contract text without versioning).

## Authentication
- Families: Supabase Auth magic links.
- Staff: Supabase Auth staff login (email/password or SSO if available).
- Staff roles stored in StaffUser/Profile and enforced via RLS.
- Recommended: MFA for admins.

## Authorization (RLS — Conceptual Requirements)
- **Student**
  - Family can SELECT/UPDATE only where student.family_account_id == auth.uid() (or mapped family id).
  - Staff can SELECT according to role; directors limited to roster/profile needs; admins full.
- **Contract / ContractAcceptance**
  - Families can read active contract text.
  - Families can create acceptance only for their student(s).
  - Staff can read all; only admins can create/activate contract versions.
- **Bookings**
  - Families can create/update/cancel only their student(s), and only before lock time.
  - Directors generally read-only; admin can override.
- **AuditionSlot / DanceSession / AuditionWindowConfig**
  - Families read-only (only what they need to select a slot/session).
  - Directors can edit AuditionWindowConfig (and optionally generate sessions/slots if granted).
  - Admin full control.
- **Exports / Packs**
  - Only staff can generate; no public endpoints; no public share links.

## Lock Time Enforcement
- Policy: 2:00 PM local time on audition day.
- Enforcement must occur server-side (DB/RPC validation), not only in UI.
- Admin override bypasses lock.

## Overbooking Prevention (Hard Requirement)
- Use transactional RPC for Vocal booking that:
  - checks capacity at commit
  - enforces uniqueness: one vocal booking per student
  - returns clear conflict errors for clients
- Apply same approach to DanceSession if capacity is used.

## Storage Security (Photos) — Confirmed M3
- **Bucket:** `student-photos`, private (public=false).
- **Path convention:** `{auth.uid()}/{crypto.randomUUID()}.{ext}` — never uses student names.
- **RLS policies on storage.objects:**
  - Families can INSERT/SELECT/UPDATE only in their own UID folder.
  - Staff can SELECT all photos (for rosters/packs).
  - No DELETE policy for families (admin-only via dashboard).
- **Access:** Signed URLs with 5-minute expiry for display; never public URLs.
- **Verified:** UUID paths, folder-based ownership, no predictable filenames.

## Input Validation
- Validate required fields server-side (or via DB constraints where possible).
- Sanitize free-text responses for display/export contexts.

## Audit Logging
Minimum required:
- created_at/updated_at on all core records.
- created_by/updated_by for student edits, booking changes, config changes.
- admin override log (who, what, when, before/after snapshot references).

## Compliance Notes (Minors)
- Principle of least privilege.
- Avoid collecting unnecessary PII.
- Ensure staff accounts are tightly controlled and reviewed.

## Security Test Checklist (Milestone Gate)
- Verify family cannot access any other student by direct ID.
- Verify staff-only endpoints cannot be accessed by anon/family.
- Verify photos cannot be accessed without auth.
- Attempt concurrent booking for last seat; ensure only one succeeds.
- Verify contract versioning: old acceptances remain tied to old versions.