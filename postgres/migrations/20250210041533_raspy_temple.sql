/*
  # Admin Profiles Schema Update

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper permissions
    - Add insert policy for new users
    - Grant necessary permissions to authenticated users

  2. Security
    - Maintain RLS policies for user access control
    - Users can only read/update their own profiles
    - Super admins retain full access
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON admin_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON admin_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON admin_profiles;
  DROP POLICY IF EXISTS "Super admins can read all profiles" ON admin_profiles;
END $$;

-- Create policies

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON admin_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON admin_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON admin_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
  ON admin_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'super_admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON admin_profiles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;