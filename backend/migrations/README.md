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

get_random_products RPC
-----------------------

The repository includes `003_get_random_products.sql` which defines a small RPC that returns a randomized set of rows from `lego_products`.

Recommended: open the file `backend/migrations/003_get_random_products.sql` and run it in the Supabase SQL editor. Example SQL (already present in the file):

```sql
CREATE OR REPLACE FUNCTION public.get_random_products(product_limit INT DEFAULT 4)
RETURNS SETOF public.lego_products
LANGUAGE sql
STABLE
AS $$
   SELECT *
   FROM public.lego_products
   ORDER BY random()
   LIMIT product_limit;
$$;
```

If your API uses the `anon` key (public endpoints), you may need to grant execute permission on the function to the `anon` role:

```sql
GRANT EXECUTE ON FUNCTION public.get_random_products(INT) TO anon;
```

After the RPC exists, the backend will call it via PostgREST at `/rpc/get_random_products` to fetch featured/random products.