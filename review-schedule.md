# Review Schedule (Governance Level 3 — Controlled)

## Governance Summary
Scale Score: 3/5 → Minimum Governance Level: 3 (Controlled)

Required controls:
- Milestone-based delivery with gated reviews
- Automated tests for core rules (gating, uniqueness, capacity)
- Manual validation checklist at each milestone
- Security/RLS review checkpoints
- Rollback plan per milestone

---

## Milestone Reviews

### M1 — Auth + Roles + RLS Skeleton
**Reviewers:** Admin + Director representative  
**Must verify:**
- Family login works (magic link).
- Staff login works (role-based).
- RLS prevents family from reading any other student.
- No roster accessible without staff auth.
**Rollback:** revert RLS/policy changes and UI routes to previous stable tag.

---

### M2 — Contract Versioning + Gated Registration Completion
**Must verify:**
- Photo required.
- Dual typed signatures required.
- Contract acceptance tied to active contract version.
- Updating contract creates new version; old acceptances remain.
- Scheduling/sign-up blocked until registration_complete.
**Rollback:** revert contract activation and UI gating logic.

---

### M3 — Director Scheduling Configuration
**Must verify:**
- Directors can set audition dates and start/end windows for Dance, Vocal, Callbacks (as permitted).
- Audit entries exist for config changes.
- Changes after bookings have a defined admin resolution path.
**Rollback:** restore prior config snapshot.

---

### M4 — Dance Sessions + Sign-Up
**Must verify:**
- One dance sign-up per student.
- Capacity enforcement works if enabled.
- Roster shows only dance attendees; staff-only.
**Rollback:** restore sessions and bookings from snapshot export.

---

### M5 — Vocal Slots + Transactional Booking
**Must verify:**
- 15-minute slots, cap=7.
- Exactly one vocal slot per student.
- Concurrency test: two clients attempt last spot → only one succeeds.
- Reschedule works until 2:00 PM day-of; lock enforced server-side.
**Rollback:** revert RPC and constraints; restore bookings if needed.

---

### M6 — Callbacks Invite + Window + Notifications (Email)
**Must verify:**
- callback_invited gating and staff views.
- No booking/sign-up exists for callbacks.
- Email notification template and audit entries.
**Rollback:** disable notification job; revert invite flags if necessary.

---

### M7 — Rosters + PDF Packs + CSV Exports
**Must verify:**
- Track-appropriate grouping:
  - Vocal by slot, Dance by session, Callbacks by invited list/window.
- PDF includes photo, key responses, participation info, notes area.
- Exports staff-auth only.
**Rollback:** disable export endpoints/features.

---

### Final Security Review (Pre-Launch)
- Attempt IDOR access with guessed IDs (must fail).
- Validate photo storage access restrictions.
- Confirm no public roster endpoints or cached pages.
- Confirm admin override logging is present.