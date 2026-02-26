# Deviation Report

## Defaults (Applied)
- Supabase as system of record (DB + Auth + Storage).
- Static frontend hosting (e.g., GitHub Pages).
- RLS as mandatory enforcement boundary.
- Transactional capacity enforcement for Vocal booking.
- Modular/hybrid architecture: functional rule modules + small OOP adapters.

## Deviations (None Recorded Yet)
No deviations from baseline standards have been requested or approved.

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