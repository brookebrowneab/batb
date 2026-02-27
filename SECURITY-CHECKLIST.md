# Security Checklist — Manual Verification (Penetration-Lite)

## Pre-Conditions

- Running Supabase instance with all 13 migrations applied
- At least one admin user, one director user, and two family users
- At least two students (owned by different families)
- Test data: at least one dance session, one vocal slot, one active contract

---

## 1. IDOR Prevention (Family Isolation)

- [ ] Family A: attempt to read Family B's student via `supabase.from('students').select('*').eq('id', '<family_b_student_id>')` — MUST return empty
- [ ] Family A: attempt to read Family B's contract acceptances — MUST return empty
- [ ] Family A: attempt to read Family B's dance signup — MUST return empty
- [ ] Family A: attempt to read Family B's vocal booking — MUST return empty

## 2. Photo Storage Security

- [ ] Attempt to access a signed photo URL without authentication — MUST fail
- [ ] Family A: attempt to list files in Family B's storage folder — MUST return empty
- [ ] Verify signed URLs expire after 5 minutes

## 3. Staff-Only Views

- [ ] Family user: navigate to `#/staff` — MUST redirect to login or dashboard
- [ ] Family user: navigate to `#/admin` — MUST redirect
- [ ] Family user: `supabase.from('notification_sends').select('*')` — MUST return empty
- [ ] Family user: `supabase.from('student_evaluations').select('*')` — MUST return empty
- [ ] Family user: `supabase.from('admin_audit_log').select('*')` — MUST return empty

## 4. Director Privilege Boundaries

- [ ] Director: attempt to activate a contract — MUST fail (admin-only RPC)
- [ ] Director: attempt to delete audition config — MUST fail (admin-only RLS)
- [ ] Director: navigate to `#/admin` — MUST redirect

## 5. Booking Integrity

- [ ] Family: attempt dance sign-up before `registration_complete` — RPC MUST reject
- [ ] Family: attempt vocal booking before `registration_complete` — RPC MUST reject
- [ ] Family: attempt to book a second vocal slot (while one exists) — MUST fail
- [ ] Family: sign up for dance session, then sign up again — MUST upsert (replace, not duplicate)
- [ ] Fill a vocal slot to 7 bookings, attempt 8th — MUST fail with capacity error

## 6. Concurrency Test (Vocal)

- [ ] Open two browser tabs as different families
- [ ] Slot has 6 of 7 bookings filled
- [ ] Both families attempt to book simultaneously
- [ ] Verify only one succeeds, the other gets a capacity error

## 7. Lock Time Enforcement

- [ ] Before 2:00 PM on audition day: family can change booking — MUST succeed
- [ ] After 2:00 PM on audition day: family tries to change — MUST fail
- [ ] Admin attempts override after lock — MUST succeed

## 8. Export Security

- [ ] Family user: no export buttons visible on any page (staff-only routes)
- [ ] Verify PDFs contain "Staff Only — Do Not Distribute" footer
- [ ] No public share links generated in any export

## 9. No Public Roster

- [ ] Unauthenticated: navigate to any `/staff` route — MUST redirect
- [ ] Unauthenticated: `supabase.from('students').select('*')` — MUST return empty (RLS blocks anon)
- [ ] Verify no public bucket URLs exist in any source file

## 10. Admin Audit Trail

- [ ] Perform an admin dance override — verify entry in `admin_audit_log`
- [ ] Perform an admin vocal override — verify entry in `admin_audit_log`
- [ ] Activate a contract — verify entry in `admin_audit_log`
- [ ] Toggle callback invite — verify entry in `admin_audit_log`
- [ ] Update scheduling config — verify entry in `admin_audit_log`

---

## Sign-Off

| Item | Date | Reviewer | Result |
|------|------|----------|--------|
| IDOR Prevention | | | |
| Photo Security | | | |
| Staff-Only Views | | | |
| Director Boundaries | | | |
| Booking Integrity | | | |
| Concurrency | | | |
| Lock Time | | | |
| Export Security | | | |
| No Public Roster | | | |
| Audit Trail | | | |
