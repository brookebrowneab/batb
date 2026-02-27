# Deviation Report

## Defaults (Applied)
- Supabase as system of record (DB + Auth + Storage).
- Static frontend hosting (e.g., GitHub Pages).
- RLS as mandatory enforcement boundary.
- Transactional capacity enforcement for Vocal booking.
- Modular/hybrid architecture: functional rule modules + small OOP adapters.

## Deviations

### DEV-001 — Separate Booking Tables Instead of Unified Booking Entity
**Constraint reference:** data-architecture.md describes a unified `Booking` table with `track` enum.
**Actual implementation:** Separate `dance_signups` and `vocal_bookings` tables (one per track).
**Decision reference:** D-011 in decision-log.md.
**Rationale:** Simpler unique constraints (`UNIQUE(student_id)` per table), cleaner RLS policies, independent RPCs per track with different capacity/concurrency rules.
**Risk assessment:** Low. Two queries needed for "all bookings for a student" vs. one, but roster views are track-separated anyway.
**Status:** Accepted — architectural improvement over the conceptual model.

### DEV-002 — Hard Delete for Booking Cancellations Instead of Soft-Cancel
**Constraint reference:** claude-constraints.md §Implementation Defaults: "Use soft-cancel for bookings (keep cancellation history) unless instructed otherwise."
**Actual implementation:** `delete_dance_signup` and `cancel_vocal_booking` RPCs use `DELETE FROM` — the row is permanently removed.
**Rationale:** At MVP scale (~200 users), cancellation history has minimal operational value. Hard delete keeps the unique constraint simple (`UNIQUE(student_id)`) without needing a partial index excluding cancelled rows. Soft-cancel would require `WHERE cancelled_at IS NULL` conditions in capacity counts, lock checks, and uniqueness enforcement.
**Risk assessment:** Medium-low. Cancellation history is lost, which could matter for dispute resolution. Mitigated by: (a) the booking tables have `created_at`/`updated_at`/`created_by_user_id` columns that exist while the record exists, and (b) admin overrides are always upserts (never deletes), so admin actions are preserved.
**Remediation path:** If soft-cancel is needed later, add a `cancelled_at` + `cancelled_by` column, replace DELETE with UPDATE, and add partial unique index `WHERE cancelled_at IS NULL`. This is a non-breaking migration.
**Status:** Accepted for MVP — revisit if dispute resolution becomes a concern.

## Future Potential Deviations (Require Explicit Approval)
1. **Public share links for audition packs**
   - Risk: accidental data disclosure.
   - Recommendation: avoid; keep staff-auth only.
2. **SMS texting**
   - Adds vendor integration, consent requirements, and compliance considerations.
   - Recommendation: phase after MVP; implement opt-in and audit logs.
3. **Allow directors to edit student registration fields**
   - Risk: data integrity + privacy.
   - Recommendation: keep admin-only for MVP.