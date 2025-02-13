import React, { useState } from 'react';
import { Shield, Bell, Clock, Save } from 'lucide-react';
import { updateUserPreferences } from '../lib/api';

export interface Preferences {
  twoFactorEnabled: boolean;
  notificationsEnabled: boolean;
  notificationPreference: string;
  timezone: string;
}

export interface UserPreferencesProps {
  preferences: Preferences;
  onMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
  onPreferencesChange: (changes: Partial<Preferences>) => void;
}

export function UserPreferences({ preferences, onPreferencesChange, onMessage }: UserPreferencesProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onMessage(null);

    try {
      await updateUserPreferences({
        twoFactorEnabled: preferences.twoFactorEnabled,
        notificationsEnabled: preferences.notificationsEnabled,
        notificationPreference: preferences.notificationPreference,
        timezone: preferences.timezone,
      });

      onMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch (error) {
      console.error('Error updating preferences:', error);
      onMessage({ type: 'error', text: 'Error updating preferences. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
        <legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">Preferences</legend>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400" />
              <label htmlFor="twoFactorEnabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Two-Factor Authentication (2FA)
              </label>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="twoFactorEnabled"
                checked={preferences.twoFactorEnabled}
                onChange={(e) => onPreferencesChange({ twoFactorEnabled: e.target.checked })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-300 border-4 appearance-none cursor-pointer"
              />
              <label
                htmlFor="twoFactorEnabled"
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400" />
              <label htmlFor="notificationsEnabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Notifications
              </label>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="notificationsEnabled"
                checked={preferences.notificationsEnabled}
                onChange={(e) => onPreferencesChange({ notificationsEnabled: e.target.checked })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-300 border-4 appearance-none cursor-pointer"
              />
              <label
                htmlFor="notificationsEnabled"
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notificationPreference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification Preference
            </label>
            <div className="mt-1">
              <select
                id="notificationPreference"
                value={preferences.notificationPreference}
                onChange={(e) => onPreferencesChange({ notificationPreference: e.target.value })}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="email">Email</option>
                <option value="text">Text Message</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Zone
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="timezone"
                value={preferences.timezone}
                onChange={(e) => onPreferencesChange({ timezone: e.target.value })}
                className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving Preferences...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
