# Claude Code Context — Secure, Gated Audition System

You are Claude Code building an application from this repository. Your job is to iteratively implement the system described in:
- project-plan.md
- data-architecture.md
- security-profile.md
- decision-log.md
- review-schedule.md

## Non-Negotiable Requirements
1. Supabase is the database + auth + storage layer.
2. Frontend must be deployable to a static host (e.g., GitHub Pages).
3. No public roster. Any roster/profile/export requires staff auth + role authorization.
4. Families can only access their own student(s).
5. Scheduling/sign-up is blocked until registration + photo + both typed signatures are complete.
6. Vocal scheduling is 15-minute slots, capacity 7, exactly one slot per student.
7. Dance requires sign-up (attendance/session), not 15-minute slots; exactly one dance sign-up per student.
8. Callbacks are invite-only attendance during a window; no booking/sign-up.
9. Lock time: families can change Dance/Vocal until 2:00 PM local time on audition day; after that admin override only.
10. No overbooking is allowed: capacity enforcement must be transactional at DB/RPC level.
11. Contract versioning is immutable: updates create a new version; acceptances are tied to versions and never overwritten.

## Build Style Requirements (Architecture)
- Prefer a modular/hybrid style:
  - Stateless rule/validation modules are functional/procedural.
  - Use small classes only for stateful adapters (e.g., Supabase client wrapper, PDF exporter).
- Ports-and-adapters boundary:
  - Domain rules must not depend on UI frameworks or Supabase specifics.
  - Put all side-effects at the edges (Supabase calls, email calls, PDF rendering).
- Composition over inheritance. Keep modules small with narrow interfaces.

## Deliverables Rules
- Work milestone-by-milestone as in review-schedule.md.
- Each milestone must include:
  1) implementation
  2) automated tests (at least for gating/capacity/uniqueness/lock checks)
  3) manual validation checklist
  4) documentation updates (decision-log if decisions change)

## Security Rules
- Treat the frontend as untrusted.
- Enforce authorization via Supabase RLS and RPC checks.
- Never leak roster data in client logs or error messages.
- Never make photo storage public. Use private buckets and signed URLs.
- Any export (PDF/CSV) must require staff auth and must not generate a public link.

## Data Integrity Rules
- Booking writes must be atomic:
  - exactly one vocal booking per student
  - capacity <= 7 per slot
  - lock time enforced server-side (except admin override)
- Contract text is immutable once published. Create new version for edits.

## UX Rules
- Family flow: simple, mobile-first, minimal steps.
- Use clear status indicators:
  - Registration incomplete → show what's missing
  - Registration complete → enable Dance sign-up + Vocal scheduling
  - After lock → show "locked" and explain admin-only changes
- Avoid showing other students’ names or rosters to families; show only spot counts.

## Reporting / Packs
- PDF packs grouped by track:
  - Dance: by session/day
  - Vocal: by date + slot
  - Callbacks: invited list + window metadata
- Each student page includes photo + key responses + participation info + notes space.