-- ============================================================
-- MIGRATION_V11_RLS_POLICIES.sql
-- Fix Row Level Security (RLS) policies for profiles & customers_master
-- ============================================================

-- 1. PROFILES TABLE RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public / Authenticated read profiles" ON public.profiles;
CREATE POLICY "Public / Authenticated read profiles" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
CREATE POLICY "Allow insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
CREATE POLICY "Allow update profiles" 
ON public.profiles FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow delete profiles" ON public.profiles;
CREATE POLICY "Allow delete profiles" 
ON public.profiles FOR DELETE 
USING (true);


-- 2. CUSTOMERS_MASTER TABLE RLS POLICIES
ALTER TABLE public.customers_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read customers master" ON public.customers_master;
CREATE POLICY "Public read customers master" 
ON public.customers_master FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert customers master" ON public.customers_master;
CREATE POLICY "Allow insert customers master" 
ON public.customers_master FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update customers master" ON public.customers_master;
CREATE POLICY "Allow update customers master" 
ON public.customers_master FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow delete customers master" ON public.customers_master;
CREATE POLICY "Allow delete customers master" 
ON public.customers_master FOR DELETE 
USING (true);
