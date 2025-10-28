
-- Safe schema reconcile: modify existing tables where necessary, create missing tables
-- We'll add columns (if missing) to existing tables and create missing canonical tables.
-- Require pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create base tables if they are missing so subsequent ALTERs and FK constraints
-- can run idempotently. These definitions mirror the project's other SQL files
-- and the runtime expectations (e.g. lego_products.id is TEXT in import scripts).

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    name VARCHAR(100),
    password_hash TEXT
);

CREATE TABLE IF NOT EXISTS public.lego_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    price_shipping_included NUMERIC DEFAULT 0 CHECK (price_shipping_included >= 0),
    lego_pieces INTEGER DEFAULT 0 CHECK (lego_pieces >= 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES public.lego_products(id) ON DELETE CASCADE,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.lego_products(id) ON DELETE CASCADE,
    quantity INTEGER CHECK (quantity > 0),
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address TEXT,
    total_price NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50),
    reference_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id UUID,
    action VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_activity (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Ensure existing tables have required columns (use ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
-- -----------------------------

-- users (existing: id uuid, username, email, password, role, created_at, updated_at, name, password_hash)
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS username varchar(50);
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS email varchar(100);
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS password varchar(255);
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS role varchar(20) DEFAULT 'user';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS name varchar(100);
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS password_hash text;
-- ensure unique index on email exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='users_email_idx') THEN
        CREATE UNIQUE INDEX users_email_idx ON public.users(email);
    END IF;
END$$;

-- lego_products (existing table) - add missing columns
ALTER TABLE IF EXISTS public.lego_products ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE IF EXISTS public.lego_products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE IF EXISTS public.lego_products ADD COLUMN IF NOT EXISTS price_shipping_included numeric;
ALTER TABLE IF EXISTS public.lego_products ADD COLUMN IF NOT EXISTS lego_pieces integer;
ALTER TABLE IF EXISTS public.lego_products ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
ALTER TABLE IF EXISTS public.lego_products ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
-- add check constraints if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lego_products_lego_pieces_check') THEN
        ALTER TABLE public.lego_products ADD CONSTRAINT lego_products_lego_pieces_check CHECK (lego_pieces >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lego_products_price_shipping_included_check') THEN
        ALTER TABLE public.lego_products ADD CONSTRAINT lego_products_price_shipping_included_check CHECK (price_shipping_included >= 0);
    END IF;
END$$;

-- product_images (existing)
ALTER TABLE IF EXISTS public.product_images ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE IF EXISTS public.product_images ADD COLUMN IF NOT EXISTS image_url text;
-- ensure FK to lego_products (product_id is text)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='product_images_product_id_fkey') THEN
        BEGIN
            ALTER TABLE public.product_images ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.lego_products(id) ON DELETE CASCADE;
        EXCEPTION WHEN undefined_table THEN
            -- lego_products may not exist yet; ignore
            NULL;
        END;
    END IF;
END$$;

-- orders (existing)
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS quantity integer;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'pending';
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_quantity_check') THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_quantity_check CHECK (quantity > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_user_id_fkey') THEN
        BEGIN
            ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        EXCEPTION WHEN undefined_table THEN NULL;
        END;
    END IF;
END$$;

-- event_logs (existing)
ALTER TABLE IF EXISTS public.event_logs ADD COLUMN IF NOT EXISTS event_type varchar(50);
ALTER TABLE IF EXISTS public.event_logs ADD COLUMN IF NOT EXISTS reference_id integer;
ALTER TABLE IF EXISTS public.event_logs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE IF EXISTS public.event_logs ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- admin_audit_log (existing)
ALTER TABLE IF EXISTS public.admin_audit_log ADD COLUMN IF NOT EXISTS admin_id uuid;
ALTER TABLE IF EXISTS public.admin_audit_log ADD COLUMN IF NOT EXISTS action varchar(100);
ALTER TABLE IF EXISTS public.admin_audit_log ADD COLUMN IF NOT EXISTS details text;
ALTER TABLE IF EXISTS public.admin_audit_log ADD COLUMN IF NOT EXISTS timestamp timestamp DEFAULT now();

-- user_activity (existing)
ALTER TABLE IF EXISTS public.user_activity ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS public.user_activity ADD COLUMN IF NOT EXISTS action varchar(100);
ALTER TABLE IF EXISTS public.user_activity ADD COLUMN IF NOT EXISTS details text;
ALTER TABLE IF EXISTS public.user_activity ADD COLUMN IF NOT EXISTS timestamp timestamp DEFAULT now();

-- -----------------------------
-- Create canonical tables that may be missing (carts, cart_items, order_items, payments, reviews)
-- -----------------------------

CREATE TABLE IF NOT EXISTS public.carts (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    status varchar(20) DEFAULT 'active' CHECK (status IN ('active','checked_out','abandoned')),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id serial PRIMARY KEY,
    cart_id integer REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.lego_products(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    added_at timestamp DEFAULT now(),
    price_snapshot numeric(10,2)
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id serial PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.lego_products(id) ON DELETE SET NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    price_each numeric(10,2) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (quantity * price_each) STORED
);

CREATE TABLE IF NOT EXISTS public.payments (
    id serial PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    provider varchar(50) DEFAULT 'Hoodpay.io',
    transaction_id varchar(200) UNIQUE,
    status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed','refunded')),
    amount numeric(10,2),
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.lego_products(id) ON DELETE CASCADE,
    rating smallint CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamp DEFAULT now()
);

-- Ensure indexes and aggregated view exist for reviews (helps queries for top-rated products)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_reviews_product_id') THEN
        EXECUTE 'CREATE INDEX idx_reviews_product_id ON public.reviews (product_id)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_reviews_product_rating') THEN
        EXECUTE 'CREATE INDEX idx_reviews_product_rating ON public.reviews (product_id, rating)';
    END IF;
END$$;

-- Create (non-concurrent) materialized view for product average ratings if it does not exist.
-- Note: refreshing the materialized view should be done periodically or after bulk imports.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'product_avg_ratings') THEN
        EXECUTE $$
        CREATE MATERIALIZED VIEW public.product_avg_ratings AS
        SELECT
          product_id,
          AVG(rating)::numeric(3,2) AS avg_rating,
          COUNT(*) AS review_count
        FROM public.reviews
        GROUP BY product_id;
        $$;
        EXECUTE 'CREATE INDEX idx_product_avg_ratings_product_id ON public.product_avg_ratings (product_id)';
    END IF;
END$$;


