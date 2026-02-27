# BATB Audition System — Launch Deployment Guide

## Prerequisites

- Supabase project (free tier or higher)
- GitHub repository with Pages enabled
- Node.js 18+ for local build

## Step 1: Configure Supabase Project

1. Create a new Supabase project at https://supabase.com
2. Note the **Project URL** and **anon/public API key** from Settings > API
3. Enable Email Auth under Authentication > Providers:
   - Enable email/password for staff logins
   - Enable magic link for family logins
4. Set the Site URL to your GitHub Pages URL under Authentication > URL Configuration

## Step 2: Run Database Migrations

Run all 13 migrations in order (`00001` through `00013`) via:

- **Supabase Dashboard**: SQL Editor > paste each file and execute, OR
- **Supabase CLI**: `supabase db push` (requires local CLI setup)

Migration files are in `supabase/migrations/`.

**Verify**: All tables created, RLS enabled on all tables, RPCs available.

## Step 3: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Create bucket: `student-photos`
   - **Public**: OFF (private bucket)
3. Storage RLS policies are applied by migration `00005`

## Step 4: Seed Staff Users

1. Create admin user via Supabase Auth dashboard (email/password):
   ```sql
   -- After creating the user in Auth, insert the staff profile:
   INSERT INTO staff_profiles (id, role, display_name, email)
   VALUES ('<auth_user_id>', 'admin', 'Admin Name', 'admin@example.com');
   ```
2. Create director user(s) with `role = 'director'`
3. Family users self-register via magic link (no seeding needed)

## Step 5: Configure Environment

1. Copy `.env.example` to `.env`
2. Set:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 6: Build and Deploy

```bash
npm ci
npm run build
```

Deploy the `dist/` folder to GitHub Pages:
- Push to your deployment branch, OR
- Use GitHub Actions for automated deployment

## Step 7: Pre-Launch Checklist

- [ ] Admin can log in with email/password
- [ ] Admin can create and activate a contract version
- [ ] Director can configure audition window dates/times
- [ ] Director can generate dance sessions and vocal slots
- [ ] Family can log in via magic link
- [ ] Family can complete full registration (student info, parent info, photo, contract)
- [ ] Family can sign up for a dance session
- [ ] Family can book a vocal slot
- [ ] Lock time prevents family changes after 2:00 PM on audition day
- [ ] Admin can override bookings after lock time
- [ ] Staff can export PDF and CSV from roster pages
- [ ] PDF footer shows "Staff Only — Do Not Distribute"
- [ ] Family user sees no export buttons (staff-only pages)
- [ ] Audit log entries appear after admin overrides

## Step 8: Recommended Security Settings

- [ ] **MFA for admin accounts**: Enable under Authentication > MFA in Supabase dashboard
- [ ] **Review staff_profiles**: Remove any test/dev users before go-live
- [ ] **Verify storage bucket is private**: Storage > student-photos > Settings
- [ ] **Site URL**: Verify it matches your production domain in Auth settings
- [ ] **Email templates**: Customize magic link email under Authentication > Email Templates

## Rollback Plan

1. Tag release candidate before go-live: `git tag rc-v1.0`
2. If issues found post-launch:
   - Revert to previous tag: `git checkout <tag> && npm run build`
   - Redeploy `dist/` folder
3. Database rollback: Supabase does not support automatic rollback. Manually revert migrations if needed (create reverse migration scripts).
4. Storage: Private bucket data is preserved through rollbacks.
