import React, { useState, useEffect } from 'react';
import { User, Phone, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfilePersonalDetailsProps {
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  },
  onMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
  onProfileChange: (changes: Partial<typeof ProfilePersonalDetailsProps['profile']>) => void;
}

// Phone number formatting helper functions
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format according to length
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

const isValidUSPhoneNumber = (phone: string) => {
  // Check if the phone number matches (XXX) XXX-XXXX format
  return /^\(\d{3}\) \d{3}-\d{4}$/.test(phone);
};

export function ProfilePersonalDetails({ profile, onProfileChange, onMessage }: ProfilePersonalDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isPhoneValid = !profile.phoneNumber || isValidUSPhoneNumber(profile.phoneNumber);

  // Set original profile values when component mounts
  useEffect(() => {
    if (!hasInitialized) {
      setOriginalProfile({ ...profile });
      setHasInitialized(true);
      setIsDirty(false);
    }
  }, [profile, hasInitialized]);

  const hasChanges = 
    profile.firstName !== originalProfile.firstName ||
    profile.lastName !== originalProfile.lastName ||
    profile.phoneNumber !== originalProfile.phoneNumber;

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    // Only update if the number is not too long
    if (formattedNumber.replace(/\D/g, '').length <= 10) {
      setIsDirty(true);
      onProfileChange({ phoneNumber: formattedNumber });
    }
  };

  const getPhoneNumberColor = () => {
    if (!profile.phoneNumber) return 'text-gray-400';
    return isValidUSPhoneNumber(profile.phoneNumber) ? 'text-green-500' : 'text-red-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onMessage(null);

    // Validate phone number if provided
    if (profile.phoneNumber && !isValidUSPhoneNumber(profile.phoneNumber)) {
      onMessage({ type: 'error', text: 'Please enter a valid US phone number in the format (XXX) XXX-XXXX' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone_number: profile.phoneNumber
        }
      });

      if (error) throw error;
      setOriginalProfile({ ...profile });
      setIsDirty(false);
      onMessage({ type: 'success', text: 'Personal details updated successfully!' });
    } catch (error) {
      console.error('Error updating personal details:', error);
      onMessage({ type: 'error', text: 'Error updating personal details. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
      <legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">Personal Details</legend>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="firstName"
                value={profile.firstName}
                onChange={(e) => {
                  setIsDirty(true);
                  onProfileChange({ firstName: e.target.value });
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="lastName"
                value={profile.lastName}
                onChange={(e) => {
                  setIsDirty(true);
                  onProfileChange({ lastName: e.target.value });
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number (US)
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className={`h-5 w-5 ${getPhoneNumberColor()}`} />
            </div>
            <input
              type="tel"
              id="phoneNumber"
              value={profile.phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="(555) 555-5555"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Format: (XXX) XXX-XXXX
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !isPhoneValid || !hasChanges || !isDirty}
            className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (loading || !isPhoneValid || !hasChanges || !isDirty) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Updating...' : 'Update Personal Details'}
          </button>
        </div>
      </div>
      </fieldset>
    </form>
  );
}