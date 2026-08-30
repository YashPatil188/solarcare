-- ============================================================
-- MIGRATION_V10_PRESERVE_ONBOARDED_PROFILES.sql
-- Preserve pre-onboarded role, name, phone & address during auth signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    existing_profile RECORD;
BEGIN
    -- Check if an admin pre-onboarded a profile with this exact email
    SELECT * INTO existing_profile 
    FROM public.profiles 
    WHERE LOWER(email) = LOWER(new.email)
    LIMIT 1;

    IF existing_profile.id IS NOT NULL THEN
        -- Link the existing pre-onboarded profile to the new Auth user UUID while preserving role, name, address, etc.
        UPDATE public.profiles
        SET 
            id = new.id,
            email = new.email,
            name = COALESCE(existing_profile.name, new.raw_user_meta_data->>'name', 'Solar Care User'),
            phone = COALESCE(existing_profile.phone, new.raw_user_meta_data->>'phone', ''),
            address = COALESCE(existing_profile.address, new.raw_user_meta_data->>'address', ''),
            role = COALESCE(existing_profile.role, new.raw_user_meta_data->>'role', 'customer')
        WHERE id = existing_profile.id OR LOWER(email) = LOWER(new.email);
    ELSE
        -- Insert new profile if no pre-onboarded record existed
        INSERT INTO public.profiles (id, name, email, phone, role)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'name', 'Solar Care User'),
            new.email,
            COALESCE(new.raw_user_meta_data->>'phone', ''),
            COALESCE(new.raw_user_meta_data->>'role', 'customer')
        )
        ON CONFLICT (id) DO UPDATE SET 
            email = EXCLUDED.email,
            role = COALESCE(public.profiles.role, EXCLUDED.role);
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
