-- Migration: create reviews table (ratings only)
-- Run this in Supabase SQL editor or via psql as the service role.

CREATE TABLE IF NOT EXISTS public.reviews (
  id serial NOT NULL,
  user_id uuid NULL,
  product_id_old_text text NULL,
  rating smallint NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  product_id uuid NULL,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES lego_products (id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT reviews_rating_check CHECK ((rating >= 1) AND (rating <= 5))
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON public.reviews USING btree (product_id, rating);

-- Note: this migration only creates the ratings table and indexes. If you have an
-- older reviews schema that included comment/title/images, you'll need to
-- migrate or drop those columns separately.
