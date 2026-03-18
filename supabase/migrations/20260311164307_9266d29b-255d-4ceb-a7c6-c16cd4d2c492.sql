
-- Remove admin role from 3f472de4 (not tbo@alpact.vc super-admin)
DELETE FROM public.user_roles 
WHERE user_id = '3f472de4-6489-481d-af89-ca0d61c7d05b' AND role = 'admin';

-- Add manager role to 3f472de4 if they're a mentor
INSERT INTO public.user_roles (user_id, role) 
VALUES ('3f472de4-6489-481d-af89-ca0d61c7d05b', 'manager')
ON CONFLICT DO NOTHING;
