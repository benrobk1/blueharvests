-- Allow users to self-assign the consumer role only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'Users can assign consumer role to self'
  ) THEN
    CREATE POLICY "Users can assign consumer role to self"
      ON public.user_roles FOR INSERT
      WITH CHECK (auth.uid() = user_id AND role = 'consumer'::app_role);
  END IF;
END $$;