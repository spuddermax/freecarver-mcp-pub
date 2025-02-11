/*
  # Fix User View Function Type Mismatch
  
  1. Changes
    - Drop existing objects to ensure clean state
    - Recreate type and functions with exact type matches
    - Ensure consistent type casting
    
  2. Security
    - Maintains security definer settings
    - Preserves access control logic
*/

-- Drop existing policies that depend on is_admin()
DROP POLICY IF EXISTS "Admins can view all users" ON auth.users;
DROP POLICY IF EXISTS "Users can view their own data" ON auth.users;

-- Drop existing objects in correct order
DROP FUNCTION IF EXISTS public.get_visible_users();
DROP FUNCTION IF EXISTS public.is_admin();
DROP TYPE IF EXISTS public.user_view_result;

-- Create type for user view results
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
    SELECT COALESCE(raw_user_meta_data->>'role', 'viewer')::text IN ('admin', 'super_admin')
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
      id::uuid,
      email::text,
      COALESCE(raw_user_meta_data->>'role', 'viewer')::text as role,
      COALESCE(raw_user_meta_data->>'first_name', '')::text as first_name,
      COALESCE(raw_user_meta_data->>'last_name', '')::text as last_name,
      COALESCE(raw_user_meta_data->>'avatar_url', '')::text as avatar_url,
      created_at::timestamptz,
      last_sign_in_at::timestamptz,
      confirmed_at::timestamptz
    FROM auth.users;
  ELSE
    -- Regular users can only see their own data
    RETURN QUERY
    SELECT 
      id::uuid,
      email::text,
      COALESCE(raw_user_meta_data->>'role', 'viewer')::text as role,
      COALESCE(raw_user_meta_data->>'first_name', '')::text as first_name,
      COALESCE(raw_user_meta_data->>'last_name', '')::text as last_name,
      COALESCE(raw_user_meta_data->>'avatar_url', '')::text as avatar_url,
      created_at::timestamptz,
      last_sign_in_at::timestamptz,
      confirmed_at::timestamptz
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- Recreate policies
CREATE POLICY "Admins can view all users"
ON auth.users
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view their own data"
ON auth.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);