-- Create invoices table to store generated PDF invoice metadata
-- Run this on your Postgres (or via Supabase SQL) to create the table used by the backend

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE,
  order_id uuid UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  path text NOT NULL,
  mime_type text DEFAULT 'application/pdf',
  size_bytes bigint,
  amount numeric(12,2),
  currency varchar(8) DEFAULT 'USD',
  payment_provider text,
  payment_transaction_id text,
  status varchar(32) DEFAULT 'stored',
  content bytea,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON public.invoices(created_at DESC);

-- Example: select * from invoices where user_id = '<uuid>';
