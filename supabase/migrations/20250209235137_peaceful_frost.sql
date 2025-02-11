/*
  # Create admin_users table with role-based access control

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key) - matches auth.users.id
      - `email` (text, unique) - user's email address
      - `password_hash` (text) - user's password, hashed
      - `role` (text) - user's role (super_admin, admin, editor, viewer)
      - `created_at` (timestamptz) - when the record was created
      - `updated_at` (timestamptz) - when the record was last updated

  2. Security
    - Enable RLS on `admin_users` table
    - Add policies for:
      - Super admins can do everything
      - Admins can read all records and modify non-super-admin records
      - Editors and viewers can only read records
*/

-- Create enum for role types
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'editor', 'viewer');

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role admin_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS admin_role AS $$
  SELECT role FROM admin_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Create policies

-- Super admins can do everything
CREATE POLICY "Super admins have full access"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'super_admin'::admin_role)
  WITH CHECK (get_user_role() = 'super_admin'::admin_role);

-- Admins can read all records
CREATE POLICY "Admins can read all records"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin'::admin_role);

-- Admins can modify non-super-admin records
CREATE POLICY "Admins can modify non-super-admin records"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'::admin_role AND
    role != 'super_admin'::admin_role
  )
  WITH CHECK (
    get_user_role() = 'admin'::admin_role AND
    role != 'super_admin'::admin_role
  );

-- Editors and viewers can only read records
CREATE POLICY "Editors and viewers can read records"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    get_user_role() IN ('editor'::admin_role, 'viewer'::admin_role)
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create index on role for faster policy evaluation
CREATE INDEX admin_users_role_idx ON admin_users(role);