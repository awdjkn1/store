This folder contains simple SQL migrations for manual application to your Supabase database.

001_add_created_at_admin_audit_log.sql
- Adds a `created_at` timestamptz column to the `admin_audit_log` table (if missing).

How to run
1) Supabase UI (recommended):
   - Open your Supabase project -> SQL Editor -> New Query
   - Paste the SQL from the file and run it.

2) psql (if you have a DB URL/service role connection):
   - Save the SQL locally and run:
     psql "<YOUR_SUPABASE_DB_URL>" -f backend/migrations/001_add_created_at_admin_audit_log.sql

3) supabase CLI (alternatively):
   - supabase db query "$(cat backend/migrations/001_add_created_at_admin_audit_log.sql)"

Notes
- This migration is idempotent (uses IF NOT EXISTS) so it's safe to run multiple times.
- After running, PostgREST/cache should reflect the new column. If PostgREST continues to complain, try refreshing/clearing the schema cache in your Supabase project or reloading the API.