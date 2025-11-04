-- Migration: add created_at column to admin_audit_log if missing
-- Run this in your Supabase SQL editor or via psql using the service role connection.

ALTER TABLE public.admin_audit_log
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
