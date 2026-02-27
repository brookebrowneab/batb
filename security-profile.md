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
- **XSS prevention (confirmed M5/M6):** All user-provided data (`first_name`, `last_name`, `grade`, `email`, `display_name`, `label`, `text_snapshot`, typed signatures) is passed through `escapeHtml()` before insertion into `innerHTML`. Shared utility at `src/ui/escapeHtml.js`.

## Audit Logging (Confirmed M10)
- **Dedicated audit table:** `admin_audit_log` — append-only, staff-readable, no direct INSERT/UPDATE/DELETE. Inserts via SECURITY DEFINER `log_admin_audit` RPC only.
- **Actions logged:** admin_override_dance_signup, admin_override_vocal_booking, toggle_callback_invite, activate_contract, create_config, update_config, create_contract.
- **Details column:** JSONB snapshot of relevant parameters (student_id, session_id, slot_id, etc.).
- **Actor attribution:** All critical tables have created_by/updated_by fields (backfilled in migration 00012); admin overrides additionally logged in admin_audit_log with actor_id.
- **Audit field coverage:** students, dance_signups, vocal_bookings have full 4-field audit. Config tables have created_by + updated_by. Immutable tables (contracts, acceptances) have created_by/signed_by only.

## Rate Limiting (Confirmed M10)
- **Client-side guard:** `createSubmitGuard` utility wraps async handlers with in-flight blocking and cooldown (default 1000ms).
- **Applied to:** Export buttons (PDF/CSV) on all three roster pages.
- **Existing protection:** All form buttons already disable during async operations (defense-in-depth).
- **Server-side:** No Supabase rate limiting available without Edge Functions. Transactional RPCs with SELECT FOR UPDATE provide natural serialization for booking operations.

## Compliance Notes (Minors)
- Principle of least privilege.
- Avoid collecting unnecessary PII.
- Ensure staff accounts are tightly controlled and reviewed.

## Export Access Restrictions (Confirmed M9)
- **Authorization**: Double-gated — orchestration layer calls `assertStaff()` (throws if not admin/director), and PDF/CSV generators also check `canExport(role)` (defense-in-depth).
- **No public share links**: Structural tests verify no `getPublicUrl`, `publicUrl`, `shareLink`, or `share_link` in any export file.
- **No family access**: No family page imports from `../exports/`, no `/family/export` route exists.
- **Photo handling in exports**: Photos fetched via signed URLs (`getSignedPhotoUrl`) → converted to base64 data URLs for PDF embedding. PDFs contain no expiring URLs or external references.
- **Client-side only**: All PDF/CSV generation happens in the browser. No server-side export endpoints. Files are created as Blobs and downloaded via ephemeral object URLs (immediately revoked).
- **PDF footer**: Every page stamped "Generated [date] — Staff Only — Do Not Distribute".

## Security Test Checklist (Milestone Gate)
- Verify family cannot access any other student by direct ID.
- Verify staff-only endpoints cannot be accessed by anon/family.
- Verify photos cannot be accessed without auth.
- Attempt concurrent booking for last seat; ensure only one succeeds.
- Verify contract versioning: old acceptances remain tied to old versions.