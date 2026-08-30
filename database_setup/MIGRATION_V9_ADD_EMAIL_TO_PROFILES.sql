-- ============================================================
-- MIGRATION_V9_ADD_EMAIL_TO_PROFILES.sql
-- Add email column to public.profiles and update auth trigger
-- ============================================================

-- 1. ADD EMAIL COLUMN TO PROFILES TABLE
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. UPDATE HANDLE_NEW_USER TRIGGER TO AUTOMATICALLY POPULATE EMAIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
        name = COALESCE(public.profiles.name, EXCLUDED.name);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
