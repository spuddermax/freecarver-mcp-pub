import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Get the directory path of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = join(__dirname, '..', '.env');
const envConfig = dotenv.parse(readFileSync(envPath));

const supabase = createClient(
  envConfig.VITE_SUPABASE_URL,
  envConfig.VITE_SUPABASE_ANON_KEY
);

async function createSuperAdmin() {
  const email = 'matthew@1from2.com';
  const password = 'Abc.123!';

  try {
    // Check if user already exists
    const { data: existingUser, error: existingError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (existingUser?.user) {
      console.log('Super admin user already exists!');
      
      // Update role in metadata if needed
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: 'super_admin' }
      });

      if (updateError) throw updateError;
      
      console.log('Updated user role to super_admin');
      return;
    }

    // Create new user with role in metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'super_admin'
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    console.log('Super admin user created successfully!');
    console.log('User ID:', authData.user.id);
    console.log('Email:', email);
    console.log('Role: super_admin');
  } catch (err) {
    console.error('Error creating super admin:', err);
    process.exit(1);
  }
}

createSuperAdmin();