-- ============================================================
-- PURGE_TEST_EMAILS.sql
-- Completely purge all test accounts and data for specified emails
-- ============================================================

DO $$
DECLARE
    target_emails TEXT[] := ARRAY[
        'vinayraikar.ai@gmail.com',
        'rameshmuchandikar50@gmail.com',
        'yash87921@gmail.com',
        'yash63663.study@gmail.com',
        'nandiniibuchadii@gmail.com',
        'nandiniudaybuchadi@gmail.com'
    ];
    target_ids UUID[];
BEGIN
    -- Collect all user UUIDs matching these emails from profiles and auth.users
    SELECT ARRAY_AGG(id) INTO target_ids
    FROM (
        SELECT id FROM public.profiles WHERE LOWER(email) = ANY(target_emails)
        UNION
        SELECT id FROM auth.users WHERE LOWER(email) = ANY(target_emails)
    ) sub;

    -- 1. Delete related Ticket Updates
    IF target_ids IS NOT NULL THEN
        DELETE FROM public.ticket_updates WHERE technician_id = ANY(target_ids);
    END IF;

    -- 2. Delete related Tickets
    IF target_ids IS NOT NULL THEN
        DELETE FROM public.tickets WHERE customer_id = ANY(target_ids) OR assigned_technician_id = ANY(target_ids);
    END IF;

    -- 3. Delete AMC Subscriptions (using user_id column)
    IF target_ids IS NOT NULL THEN
        DELETE FROM public.amc_subscriptions WHERE user_id = ANY(target_ids);
    END IF;

    -- 4. Delete Notifications
    IF target_ids IS NOT NULL THEN
        DELETE FROM public.notifications WHERE user_id = ANY(target_ids);
    END IF;

    -- 5. Delete from customers_master
    DELETE FROM public.customers_master WHERE LOWER(email) = ANY(target_emails);

    -- 6. Delete from public.profiles
    DELETE FROM public.profiles WHERE LOWER(email) = ANY(target_emails);
    IF target_ids IS NOT NULL THEN
        DELETE FROM public.profiles WHERE id = ANY(target_ids);
    END IF;

    -- 7. Delete from auth.users (frees up email addresses for clean signups)
    DELETE FROM auth.users WHERE LOWER(email) = ANY(target_emails);

    RAISE NOTICE 'Purged all test data and auth users for specified emails.';
END $$;
