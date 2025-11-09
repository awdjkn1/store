-- Migration: create get_random_products RPC
-- Run this in your Supabase SQL editor or via psql to add a DB-side random selector
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

-- Optional: revoke execute to public if you want to restrict RPC usage
-- GRANT EXECUTE ON FUNCTION public.get_random_products(INT) TO anon;
