-- MIGRATION_V4_AMC.sql

-- 1. Create AMC Plans Table
CREATE TABLE public.amc_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    duration_months INTEGER NOT NULL, -- e.g., 12, 24, 36
    price DECIMAL(10, 2) NOT NULL,
    features JSONB NOT NULL, -- Array of strings: ["2 Cleaning Visits", "1 Health Check"]
    benefits JSONB NOT NULL, -- Array of strings: ["Priority Support", "Free Inverter Fuse"]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create AMC Subscriptions Table
CREATE TABLE public.amc_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    plan_id UUID REFERENCES public.amc_plans(id) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'expired', 'cancelled')),
    services_total INTEGER DEFAULT 0,
    services_used INTEGER DEFAULT 0,
    payment_reference TEXT, -- For manual tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.amc_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amc_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Plans: Everyone can read
CREATE POLICY "Plans are viewable by everyone" 
ON public.amc_plans FOR SELECT 
USING (true);

-- Subscriptions: Users can see their own
CREATE POLICY "Users can view own subscriptions" 
ON public.amc_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Subscriptions: Users can create their own (Apply for plan)
CREATE POLICY "Users can create subscriptions" 
ON public.amc_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Subscriptions: Admins can view all
CREATE POLICY "Admins can view all subscriptions" 
ON public.amc_subscriptions FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Subscriptions: Admins can update all (Approve/Activate)
CREATE POLICY "Admins can update all subscriptions" 
ON public.amc_subscriptions FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Seed Data (Default Plans)
INSERT INTO public.amc_plans (name, duration_months, price, features, benefits) VALUES
(
    'Basic Care (1 Year)', 
    12, 
    2499.00, 
    '["2 Cleaning Visits", "1 System Health Check"]', 
    '["Standard Support", "Report Generation"]'
),
(
    'Gold Shield (1 Year)', 
    12, 
    4999.00, 
    '["4 Cleaning Visits", "2 System Health Checks", "1 Inverter Inspection"]', 
    '["Priority Support (24h)", "Free Small Parts Replacement", "Detailed Performance Report"]'
),
(
    'Platinum Guard (3 Years)', 
    36, 
    12999.00, 
    '["12 Cleaning Visits", "6 System Health Checks", "3 Inverter Inspections"]', 
    '["VIP Support (4h Response)", "Extended Inverter Warranty Support", "All Minor Repairs Included", "20% Discount on Major Repairs"]'
);
