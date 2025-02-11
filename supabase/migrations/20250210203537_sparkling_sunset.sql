/*
  # Admin Users Access Policies

  1. New Functions
    - get_user_role(): Returns the role of the current user from metadata
    - is_admin(): Checks if current user has admin or super_admin role

  2. Security
    - Add policies for admin access to auth.users
*/

-- Create function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT COALESCE(raw_user_meta_data->>'role', 'viewer')::text
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN get_user_role() IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policies for auth.users
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

-- Grant access to auth.users for authenticated users
GRANT SELECT ON auth.users TO authenticated;