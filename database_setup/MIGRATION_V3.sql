-- MIGRATION_V3.sql

-- 1. Allow Admins to UPDATE any profile (to change roles)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. Allow Admins to DELETE profiles (optional, but good for management)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Ensure Admins can SEE all profiles (already covered by "Public profiles are viewable by everyone", but good to be explicit if that changes)
-- Current policy: "Public profiles are viewable by everyone" (True). So we are good.
