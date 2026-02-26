# Claude Code Constraints & Guardrails

## Absolute Constraints
- Do not add a custom backend server that must be hosted dynamically.
- Do not implement any feature that produces a public roster, public PDF links, or unauthenticated exports.
- Do not store contracts as editable text blobs that get overwritten; must be versioned snapshots.
- Do not implement capacity checks only in the client. Must be transactional server-side.

## Platform Constraints
- Supabase keys:
  - Frontend uses anon/public key only.
  - Service role key must never be placed in frontend.
- GitHub Pages/static hosting:
  - All logic in client or in Supabase (RLS/RPC/Edge Functions optional, but prefer DB RPC first).

## “Stop and Ask” Triggers (must pause and request approval)
If any of these become necessary, stop and ask the human:
1. Adding SMS texting provider (Twilio etc.) and consent/opt-in policy.
2. Allowing directors to edit student registration fields.
3. Allowing public share links for packs/exports.
4. Collecting additional sensitive data fields beyond current needs.
5. Changing the lock time rule or gating requirements.

## Implementation Defaults
- Use soft-cancel for bookings (keep cancellation history) unless instructed otherwise.
- Keep callback workflow booking-free; use invite flag + window config + notifications.
- Directors can edit audition window config; admins can override anything.

## Documentation Discipline
- Any change to requirements must be recorded in decision-log.md.
- Any deviation from defaults must be recorded in deviation-report.md with risk assessment.