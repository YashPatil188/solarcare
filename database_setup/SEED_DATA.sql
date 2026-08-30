-- 1. Insert yourself into the Master List so you can sign up
INSERT INTO customers_master (name, email, phone, system_capacity_kw, amc_status, amc_valid_until)
VALUES 
('Super Admin', 'admin@solarcare.com', '9999999999', 10.5, 'active', NOW() + INTERVAL '1 year');

-- 2. Insert a test technician so you can assign tickets later
-- (Technicians don't need to be in customers_master, they just sign up)
-- But we can pre-create a profile entry if we wanted, or just let them sign up.
-- For now, we'll just handle the admin.

-- INSTRUCTIONS:
-- 1. Run the INSERT command above in Supabase SQL Editor.
-- 2. Go to the App (localhost:5173) and Sign Up with 'admin@solarcare.com'.
-- 3. AFTER you sign up, come back here and run this to make yourself an Admin:

/*
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@solarcare.com';
*/
