-- Migration V7: Add RLS Policy for Admins to delete tickets
CREATE POLICY "Admins delete tickets"
ON public.tickets FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
