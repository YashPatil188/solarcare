-- 1. Update customers_master STATUS
ALTER TABLE public.customers_master 
ADD COLUMN status text CHECK (status IN ('pre_registered', 'verified', 'active')) DEFAULT 'active';

-- Update existing records to 'active' to avoid breaking current users
UPDATE public.customers_master SET status = 'active' WHERE status IS NULL;

-- 2. Update tickets with METADATA and BOOKING_DATE
ALTER TABLE public.tickets 
ADD COLUMN service_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN booking_date timestamp with time zone;

-- 3. Update Policy for Customers Master (Allow inserts for pre-registration if we build a public form later, likely Admin only for now)
-- Current policy is "Admins manage customers master", which is fine for now.

-- 4. Create Index for faster searches
CREATE INDEX IF NOT EXISTS idx_customers_master_status ON public.customers_master(status);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON public.tickets(customer_id);
