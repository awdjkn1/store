-- 003_add_indexes.sql
-- Add helpful indexes to speed up admin counts and common queries.
-- Run this migration against your Postgres/Supabase instance.

-- Index creation is idempotent with IF NOT EXISTS so it is safe to run multiple times.

CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.lego_products (created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);

-- If you use searches on product name, consider a trigram index (requires pg_trgm extension):
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_lego_products_name_trgm ON public.lego_products USING gin (name gin_trgm_ops);

-- Add any other indexes for your common filters/sorts here.
