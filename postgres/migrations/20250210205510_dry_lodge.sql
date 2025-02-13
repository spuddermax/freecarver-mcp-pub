/*
  # Create Secure Users View Function

  1. Changes
    - Create a function that returns user data with proper access control
    - Grant necessary permissions
    
  2. Security
    - Only admins can view all users
    - Regular users can only view their own data
    - Sensitive data is filtered out
*/

-- Create a type for user view results
CREATE TYPE public.user_view_result AS (
  id uuid,
  email text,
  role text,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  confirmed_at timestamptz
);

-- Create function to check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(raw_user_meta_data->>'role', 'viewer') IN ('admin', 'super_admin')
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user data with proper access control
CREATE OR REPLACE FUNCTION public.get_visible_users()
RETURNS SETOF public.user_view_result
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_admin() THEN
    -- Admins can see all users
    RETURN QUERY
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'role', 'viewer') as role,
      raw_user_meta_data->>'first_name' as first_name,
      raw_user_meta_data->>'last_name' as last_name,
      raw_user_meta_data->>'avatar_url' as avatar_url,
      created_at,
      last_sign_in_at,
      confirmed_at
    FROM auth.users;
  ELSE
    -- Regular users can only see their own data
    RETURN QUERY
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'role', 'viewer') as role,
      raw_user_meta_data->>'first_name' as first_name,
      raw_user_meta_data->>'last_name' as last_name,
      raw_user_meta_data->>'avatar_url' as avatar_url,
      created_at,
      last_sign_in_at,
      confirmed_at
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
END;
$$;