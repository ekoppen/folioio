-- Create the first admin user (you'll need to sign up with this email first)
-- This is just a placeholder - after you sign up, we'll update your role to admin

-- For now, let's create a function to promote a user to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin'::user_role
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;