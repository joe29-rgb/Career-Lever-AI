-- Fix Row Level Security Policies for Jobs Table
-- Run this in Supabase SQL Editor

-- First, drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow service role full access" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated users to read all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow public SELECT on active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow SELECT for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Allow ALL for service_role" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public to read non-expired jobs
CREATE POLICY "public_read_active_jobs"
ON public.jobs
FOR SELECT
TO public
USING (expires_at > NOW());

-- Policy 2: Allow authenticated users to read all jobs
CREATE POLICY "authenticated_read_all_jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow service_role FULL ACCESS (critical for bulk inserts!)
CREATE POLICY "service_role_all_access"
ON public.jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'jobs';
