import React, { useState } from 'react';
import { Mail, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

interface UserEmailProps {
  email: string;
  onEmailChange: (email: string) => void;
  onMessage: (message: { type: 'success' | 'error' | 'info'; text: string } | null) => void;
}

export function UserEmail({ email, onEmailChange, onMessage }: UserEmailProps) {
  const [loading, setLoading] = useState(false);
  const [originalEmail, setOriginalEmail] = useState(email);
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setOriginalEmail(email);
    setIsDirty(false);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    onEmailChange(newEmail);
    setIsDirty(true);
    setIsValid(validateEmail(newEmail));
  };

  const isEmailChanged = isDirty && email !== originalEmail;
  const canSubmit = isEmailChanged && isValid && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onMessage(null);

    // Validate email
    if (!email || !validateEmail(email)) {
      onMessage({ type: 'error', text: 'Please enter a valid email address' });
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email !== email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email
        });
        
        if (emailError) throw emailError;
        
        onMessage({ 
          type: 'success', 
          text: 'A confirmation email has been sent to your new email address. Please check your inbox.'
        });
        setOriginalEmail(email);
        setIsDirty(false);
      } else {
        onMessage({ type: 'info', text: 'No changes were made to your email address.' });
      }
    } catch (error) {
      console.error('Error updating email:', error);
      onMessage({ type: 'error', text: 'Error updating email address. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
        <legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">Email Address</legend>
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
                value={email}
                onChange={handleEmailChange}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  !isValid && email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
              />
            </div>
            {!isValid && email && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                Please enter a valid email address
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Changing your email will require verification of the new address.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Update Email'}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}