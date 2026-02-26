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