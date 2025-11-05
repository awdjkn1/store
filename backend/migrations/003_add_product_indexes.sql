-- Add common indexes to speed up product list queries
-- Run this manually against your Postgres/Supabase database (psql or supabase sql)

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_lego_products_created_at ON lego_products (created_at);

-- Index for price filtering and ordering
CREATE INDEX IF NOT EXISTS idx_lego_products_price ON lego_products (price_shipping_included);

-- If you plan to support ilike '%term%' searches, consider adding pg_trgm extension and a trigram GIN index:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_lego_products_name_trgm ON lego_products USING gin (name gin_trgm_ops);

-- Note: Applying these indexes can improve SELECT performance for sorting/filtering. Run on your DB host manually.
