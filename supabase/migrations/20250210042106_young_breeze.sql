/*
  # Revert to using auth.users metadata

  This migration removes the admin_profiles table and related objects since we'll be using auth.users metadata instead.

  1. Changes
    - Drop admin_profiles table and all related objects
    - Clean up any remaining functions and triggers
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON admin_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop table (this will automatically drop related policies and indexes)
DROP TABLE IF EXISTS admin_profiles;