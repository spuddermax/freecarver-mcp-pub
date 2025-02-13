/*
  # Remove admin roles table and use Supabase auth metadata
  
  This migration removes the custom admin_users table since we'll use Supabase's
  built-in auth system with user metadata for roles.

  1. Changes
    - Drop RLS policies first
    - Drop triggers before functions
    - Drop admin_users table and related objects
    - Remove custom role management
  
  2. Notes
    - User roles will be stored in auth.users metadata
    - Objects are dropped in the correct dependency order
*/

-- First, migrate existing roles to auth.users metadata if needed
DO $$
BEGIN
  -- Only run if the admin_users table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
    -- Update auth.users metadata with roles from admin_users
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object('role', admin_users.role)
    FROM admin_users
    WHERE auth.users.id = admin_users.id;
  END IF;
END $$;

-- Drop policies first since they depend on the get_user_role function
DROP POLICY IF EXISTS "Super admins have full access" ON admin_users;
DROP POLICY IF EXISTS "Admins can read all records" ON admin_users;
DROP POLICY IF EXISTS "Admins can modify non-super-admin records" ON admin_users;
DROP POLICY IF EXISTS "Editors and viewers can read records" ON admin_users;

-- Drop trigger before the function it depends on
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;

-- Now drop other objects in correct order
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS update_updated_at();
DROP TABLE IF EXISTS admin_users;
DROP TYPE IF EXISTS admin_role;