-- ============================================================
-- MIGRATION_V8_PROFILES_TIMELINE.sql
-- SolarCare Schema Extensions: Profile Avatars, Ticket Timestamps & RLS Delete Policies
-- ============================================================

-- 1. EXTEND PROFILES TABLE
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. EXTEND TICKETS TABLE WITH TIMELINE TIMESTAMPS
ALTER TABLE public.tickets 
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 3. RLS POLICIES FOR USER & CUSTOMER DELETION BY ADMINS
CREATE POLICY "Admins delete profiles" 
ON public.profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins delete customers master" 
ON public.customers_master FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. RLS POLICY FOR USERS TO AUTO-ACTIVATE SUBSCRIPTIONS UPON DUMMY PAYMENT
CREATE POLICY "Users update own subscriptions" 
ON public.amc_subscriptions FOR UPDATE USING (
  auth.uid() = user_id
);
