import React, { useRef, useState } from 'react';
import { 
  Mail, 
  AtSign,
  Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileAccountInfoProps {
  profile: {
    email: string;
    username: string;
  };
  onProfileChange: (changes: Partial<{ email: string; username: string }>) => void;
  onMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
}

export function ProfileAccountInfo({ profile, onProfileChange, onMessage }: ProfileAccountInfoProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onMessage(null);

    // Validate email
    if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      onMessage({ type: 'error', text: 'Please enter a valid email address' });
      setLoading(false);
      return;
    }

    try {
      // Update email if changed
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email !== profile.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profile.email
        });
        
        if (emailError) throw emailError;
        
        onMessage({ 
          type: 'success', 
          text: 'A confirmation email has been sent to your new email address. Please check your inbox.' 
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: { username: profile.username }
      });

      if (error) throw error;
      onMessage({ type: 'success', text: 'Account information updated successfully!' });
    } catch (error) {
      console.error('Error updating account info:', error);
      onMessage({ type: 'error', text: 'Error updating account information. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
      <legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">Account Information</legend>
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
              <input
                type="email"
                id="email"
                value={profile.email}
                onChange={(e) => onProfileChange({ email: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Changing your email will require verification of the new address.
          </p>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AtSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="username"
              value={profile.username}
              onChange={(e) => onProfileChange({ username: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Account Info'}
          </button>
        </div>
      </div>
      </fieldset>
    </form>
  );
}