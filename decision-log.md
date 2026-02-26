# Decision Log

## D-001 — Track Scheduling Model
**Date:** 2026-02-26  
**Decision:**  
- Dance requires sign-up (attendance/session selection), not 15-minute blocks.  
- Vocal uses 15-minute blocks with capacity 7; each student books exactly one Vocal slot.  
- Callbacks are invite-only attendance during a configured window; no sign-up and no blocks.

**Rationale:** Matches operational needs and reduces complexity where scheduling precision is unnecessary.

**Implications:**  
- Need DanceSession entity (or equivalent) and Booking constraints for one-per-student dance sign-up.  
- Need AuditionSlot entity and transactional booking RPC for Vocal.  
- Callback workflow uses invite flag + notification + window display; no Booking records.

---

## D-002 — Lock Time Policy
**Date:** 2026-02-26  
**Decision:** Families may change Dance sign-up and Vocal booking until **2:00 PM local time on the audition day**; after that, admin override only.

**Rationale:** Clear operational cutoff, predictable for families and staff.

**Implications:** Lock enforcement must be server-side (RPC/DB), not only UI.

---

## D-003 — Contract Versioning
**Date:** 2026-02-26  
**Decision:** Contracts are immutable snapshots per version; admin creates new versions. Signatures are stored in ContractAcceptance tied to a specific contract version; acceptance history is never overwritten.

**Rationale:** Preserves audit trail and prevents retroactive modification.

**Implications:** Registration completion references the active contract version at completion time; re-sign policy can be admin-triggered.

---

## D-004 — Architecture Selection
**Date:** 2026-02-26  
**Decision:** **Option A** — Static SPA + Supabase (Auth/DB/Storage) + DB-transactional RPC for Vocal booking (and Dance capacity if enabled).

**Rationale:** Best fit for static hosting; strongest guarantee against overbooking; minimal infrastructure.

**Trade-offs:** Requires careful RLS and RPC design/testing.

---

## D-005 — Selected AI Build Platform
**Date:** 2026-02-26  
**Decision:** **Claude Code** will be the single AI coding platform for the build plan and prompts.

**Rationale:** User selection.

---

## D-006 — Role Detection Approach
**Date:** 2026-02-26
**Decision:** Use a `staff_profiles` table lookup for role detection rather than JWT custom claims.

**Rationale:**
- Simpler to implement with standard Supabase setup (no Edge Functions needed to set custom claims).
- Profile table is directly queryable with RLS, making it the natural enforcement boundary.
- Role changes take effect on next page load / session refresh without token reissuance.

**Trade-offs:**
- Requires an extra query on auth state change to fetch the staff profile.
- Slightly slower than reading from JWT, but acceptable for ~200-user scale.

**Implications:**
- `staff_profiles` table with RLS is the source of truth for roles.
- Client checks `staff_profiles` after auth; if no row exists, user is treated as family.
- RLS policies on other tables will reference `staff_profiles` for staff/admin checks.

---

## D-007 — Frontend Framework
**Date:** 2026-02-26
**Decision:** Vanilla JavaScript with Vite (no React/Vue/Svelte). Hash-based client-side router for GitHub Pages compatibility.

**Rationale:** Minimal dependency footprint for MVP; avoids framework lock-in; Vite provides fast dev/build; hash routing works without server-side configuration.

**Trade-offs:** More manual DOM work than a reactive framework, but acceptable at MVP scope.

---

## D-008 — Re-sign Policy for Contracts
**Date:** 2026-02-26
**Decision:** Default behavior is to **disallow** re-signing the same contract version. A unique constraint on (student_id, contract_id) enforces this at the database level. When a new contract version is activated, families must sign the new version; old acceptances remain tied to old versions.

**Rationale:** Prevents duplicate signatures, preserves audit trail, and keeps the acceptance table clean. If admin needs a family to re-sign the same version, they would need to create a new version with the same text (rare edge case).

**Implications:**
- `contract_acceptances` has a unique index on (student_id, contract_id).
- Registration completeness evaluates against the **currently active** contract version.
- Old acceptances are preserved but do not satisfy the active version requirement.