# Project Plan — Secure, Gated Audition System

## System Summary

### Purpose
A secure, privacy-preserving audition registration and participation logistics system for ~180–200 students. The system blocks all sign-ups/scheduling until registration and signatures are complete, supports distinct audition tracks with different mechanics (Dance sign-up, Vocal time-block scheduling, Callback invite-only window with no sign-up), provides staff-only roster views, and generates printable audition packs (PDF) and CSV exports.

### User Roles
- **Parent/Student (Family User)**: magic-link login; register student(s), upload required photo, sign contract (typed student + typed parent signatures), sign up for Dance session/day, book exactly one Vocal slot (15-min block), self-reschedule until lock time.
- **Director/Staff**: staff login; view rosters and student profiles; configure audition dates and time windows (Dance sessions, Vocal block windows, Callback window) as permitted; optional evaluation notes (future).
- **Admin**: staff login; full control—contracts/versioning, system configuration, overrides, exports, staff roles.

### Core Workflows
1. **Gated Registration**
   - Collect student + parent info
   - Require photo upload
   - Present active contract version
   - Collect typed student + typed parent signatures
   - Mark `registration_complete=true` only when all required items exist and are linked to the active contract version at completion time.
2. **Dance Sign-Up (Attendance, no blocks)**
   - Student chooses one Dance session/day (capacity optional).
3. **Vocal Scheduling (Blocks only)**
   - Student books exactly one 15-minute slot, capacity max 7 per slot.
   - Self-rescheduling allowed until lock time.
4. **Callbacks (Invite + Attend Window Only)**
   - Admin/staff marks `callback_invited=true`.
   - No slot scheduling or sign-up; students attend the full callback window (date + start/end).
   - Notify via email; optional SMS (later).
5. **Staff Roster + Print**
   - Track-aware rosters (Dance list by session/day; Vocal by slot; Callbacks invited list).
   - Printable audition packs (PDF) and CSV export.

### Privacy Model
- No public roster or unauthenticated access to any student data.
- Families can only view/edit their own student(s).
- Staff must authenticate for any roster/profile/export/pack view.
- Supabase Auth + RLS is the enforcement boundary; frontend is untrusted.

---

## Architecture Options (for Approval)

### Option A (Recommended MVP): Static SPA + Supabase + DB-Transactional Booking RPC
**Style choices (hybrid modular):**
- Functional/procedural modules for rules/validation (stateless).
- Small OOP adapters for integrations (Supabase client, storage URLs, PDF export service wrapper).
- Ports-and-adapters boundary: domain rules independent of UI and Supabase specifics.

**Business-capability mapping**
- Registration module → collects data, uploads photo, signs contract, computes completeness.
- Contracts module → version display, acceptance capture, history view.
- Dance participation module → session selection + attendance list.
- Vocal scheduling module → slot browsing + transactional booking/reschedule.
- Callbacks module → invite flag + window display + notifications queue (email now).
- Staff module → rosters + packs + exports.
- Admin module → contract versions, window/session configuration, overrides.

**End-to-end data flow**
- Client authenticates via Supabase Auth (magic link / staff login).
- Client reads/writes via Supabase APIs with RLS.
- Vocal booking calls a Supabase RPC (transaction) to enforce: capacity<=7 and one vocal booking per student.

**Sensitive data + trust boundaries**
- Student PII + photos stored in Supabase (DB + private storage).
- Trust boundary at Supabase RLS and RPC transaction logic.
- Client never receives roster access unless staff-auth and role-allowed.

**Security controls**
- Authn: Supabase Auth (magic link for families; staff login for staff).
- Authz: RLS policies by role and ownership; staff role claims in profile.
- Data protection: TLS in transit; storage encryption at rest (Supabase-managed).
- Photos: private bucket + signed URLs; never public paths.
- Overbooking: enforced in RPC transaction + constraints.
- Audit: created/updated timestamps + actor fields; admin actions logged.

**Trade-offs**
- Strong “no overbooking” without running your own server.
- Requires careful RLS + RPC design and testing.

---

### Option B: Static SPA + Supabase + Serverless for Booking + PDF
**Style**: ports-and-adapters; serverless handles transactional booking and PDF generation.
**Pros**: consistent PDF rendering; centralized enforcement.
**Cons**: more infrastructure (deployments, IAM, logs), more failure modes.

---

### Option C: Split App — Family UI + Separate Staff Console
**Pros**: reduces accidental exposure risk by separating surfaces.
**Cons**: higher build/maintenance overhead, two UIs.

---

## Recommendation
Choose **Option A** for MVP: simplest operationally, best fit for static hosting + Supabase, and strongest guarantee for “no 7th-seat race” using a DB-transactional RPC.

### Non-technical evaluation checklist
- Scheduling blocked until registration + photo + signatures complete ✅
- No roster visible without staff login ✅
- Cannot overbook the 7th vocal spot ✅ (transaction)
- Contract edits preserve prior signatures tied to prior versions ✅
- Families can switch until 2:00 PM day-of ✅
- Staff can print packs with photos/responses organized by track/grouping ✅

---

## Scope Rules (Final)
- **Dance**: sign-up required; not time-blocked.
- **Vocal**: 15-minute blocks; cap 7; each student books **exactly one** slot.
- **Callbacks**: invite-only; **no sign-up** and **no blocks**; students attend callback window.

**Lock Time**
- Families may create/move/cancel Dance sign-up and Vocal booking until **2:00 PM local time on the audition day**.
- After lock: admin override only.

---

## Milestones (MVP)
1. Auth + roles + RLS baseline
2. Contract versioning + gated registration completion
3. Dance session config + sign-up + roster view
4. Vocal slot generation + transactional booking + self-reschedule + lock time
5. Callback window config + invite flag + staff roster separation + notifications (email)
6. Staff roster filters + student profile view
7. PDF packs + CSV exports
8. Audit logging + security review + launch checklist

---

## Acceptance Criteria (MVP Launch Readiness)
- Families can register student(s) with required photo + dual typed signatures.
- `registration_complete` gating prevents Dance/Vocal actions until complete.
- Dance sign-up: one per student; roster works; capacity optional.
- Vocal booking: exactly one per student; cap 7; reschedule until 2:00 PM day-of; no overbooking under concurrency.
- Callbacks: invite-only list; no scheduling; window info shown; email notifications sent.
- Staff rosters and packs require staff auth; no public roster exists.
- PDF packs include photo + key responses + participation info + notes space; CSV exports work.
- RLS verified: families cannot access other students; photos are private.

---

## Deterministic Scale Score + Governance Level
### Scale Score (1–5)
Dimensions (1–5 each; deterministic):
1. Users & Concurrency: **3** (200 peak, bursts likely)
2. Data Sensitivity (PII + minors + photos): **4**
3. Security Complexity (RLS, roles, private storage): **4**
4. Workflow Complexity (gating, versioning, locks, scheduling): **4**
5. Integrations (email now; optional SMS later): **2**
6. Audit/Compliance Needs (contract acceptance history, admin logs): **3**

**Scale Score = round((3+4+4+4+2+3)/6) = round(20/6) = 3**

### Minimum Governance Level (cannot go below)
**Governance Level: 3 (Controlled)**
- Required: milestone gates, mandatory manual validation steps, security review checkpoints, test coverage expectations, rollback plan per milestone, audit logging verification.