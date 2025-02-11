/*
  # Create Super Admin User
  
  1. Changes
    - Update user metadata to set super_admin role
    - Grant necessary permissions
    
  2. Security
    - Only affects specific user
    - Maintains existing security model
*/

-- Update user metadata to set super_admin role
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'super_admin',
  'first_name', COALESCE(raw_user_meta_data->>'first_name', ''),
  'last_name', COALESCE(raw_user_meta_data->>'last_name', ''),
  'avatar_url', COALESCE(raw_user_meta_data->>'avatar_url', '')
)
WHERE email = 'matthew@1from2.com';

-- Ensure the user exists and has super_admin role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'matthew@1from2.com' 
    AND raw_user_meta_data->>'role' = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Failed to set up super admin user. Please ensure the user exists.';
  END IF;
END $$;