# Test Plan (Claude Code)

## Test Levels
1. Unit tests: domain rules (gating, lock logic, eligibility).
2. Integration tests: booking RPC transaction behavior (capacity + uniqueness).
3. E2E smoke tests (optional for MVP): key user journeys.

## Key Test Cases (must exist)
### Registration Gating
- Cannot create Booking when registration_complete=false.
- Can create Booking when registration_complete=true.

### Vocal Booking Uniqueness
- Student cannot have two Vocal bookings (even across slots).

### Vocal Slot Capacity
- 7 bookings allowed.
- 8th booking rejected.
- Race test: two concurrent attempts for final seat → only one succeeds.

### Lock Time
- Before lock: allow family update/cancel.
- After lock: reject family changes; allow admin override.

### Dance Sign-Up
- Exactly one Dance sign-up per student.
- Capacity enforcement only if dance session capacity is configured.

### Callbacks
- callback_invited toggles visibility to family of callback instructions only (no scheduling).
- No Booking records created for callback workflow.

### RLS / Authz
- Family user cannot SELECT other students by id.
- Family cannot read rosters or exports endpoints.
- Director can read roster but cannot edit contracts.
- Admin can override bookings.

## Test Data Strategy
- Seed script for:
  - contract versions
  - audition window config
  - dance sessions
  - vocal slots
  - sample students (owned by multiple family accounts)
- Use deterministic IDs for fixtures where possible.