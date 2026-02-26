# Claude Prompting Conventions (Repo)

When generating code changes:
- Work in small commits aligned to milestones.
- Always include:
  - what changed
  - how to test
  - what risks remain
- Prefer explicit types and schemas for form data.
- Keep domain rules in /domain or /core modules.
- Keep Supabase client + storage in /adapters.
- Keep UI components in /ui.
- Keep exports in /exports with staff-only gating.

Naming conventions:
- Use “family” to mean parent/student account.
- Use “staff” to mean director/admin.
- Use “dance session” for Dance attendance selection.
- Use “vocal slot” for 15-minute time blocks.
- Use “callback window” for invite-only attendance time span.