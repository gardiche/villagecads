
-- Remove admin role from Charles and add manager+mentor instead
-- First find Charles's user_id from user_roles where role='admin' and it's not tbo@alpact.vc
-- We know Charles has admin+mentor roles, we need to swap admin for manager
-- Charles's roles: we'll delete admin and insert manager for all non-tbo admin users

-- Get Charles's ID from mentor role and swap his admin to manager
DO $$
DECLARE
  charles_id uuid;
BEGIN
  -- Find Charles: user who has mentor role (not tbo)
  SELECT ur.user_id INTO charles_id
  FROM public.user_roles ur
  WHERE ur.role = 'mentor'
  LIMIT 1;
  
  IF charles_id IS NOT NULL THEN
    -- Remove admin role
    DELETE FROM public.user_roles WHERE user_id = charles_id AND role = 'admin';
    -- Add manager role
    INSERT INTO public.user_roles (user_id, role) VALUES (charles_id, 'manager')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
