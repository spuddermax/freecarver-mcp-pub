import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from './Layout';
import { Toast } from './Toast';
import { ProfileEmail } from './ProfileEmail';
import { ProfilePersonalDetails } from './ProfilePersonalDetails';
import { ProfilePicture } from './ProfilePicture';
import { ProfilePassword } from './ProfilePassword';
import { ProfilePreferences } from './ProfilePreferences';
import { useGrid } from '../lib/grid';
import { TronGrid } from './TronGrid';

export default function Profile() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { showGrid } = useGrid();
  const [profile, setProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    avatarUrl: '',
    twoFactorEnabled: false,
    notificationsEnabled: true,
    notificationPreference: 'email',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata || {};
        setProfile({
          email: user.email || '',
          firstName: metadata.first_name || '',
          lastName: metadata.last_name || '',
          phoneNumber: metadata.phone_number || '',
          avatarUrl: metadata.avatar_url || '',
          twoFactorEnabled: metadata.two_factor_enabled || false,
          notificationsEnabled: metadata.notifications_enabled ?? true,
          notificationPreference: metadata.notification_preference || 'email',
          timezone: metadata.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  return (
    <Layout>
      {message && (
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Profile Settings</h3>
            </div>

            <div className="p-6 space-y-8">
              <ProfileEmail
                email={profile.email}
                onEmailChange={(email) => setProfile(prev => ({ ...prev, email }))}
                onMessage={setMessage}
              />

              <ProfilePersonalDetails
                profile={{
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  phoneNumber: profile.phoneNumber
                }}
                onMessage={setMessage}
                onProfileChange={(changes) => setProfile(prev => ({ ...prev, ...changes }))}
              />

              <ProfilePicture
                avatarUrl={profile.avatarUrl}
                onAvatarChange={(url) => setProfile(prev => ({ ...prev, avatarUrl: url }))}
              />

              <ProfilePassword
                email={profile.email}
                onMessage={setMessage}
              />

              <ProfilePreferences
                preferences={{
                  twoFactorEnabled: profile.twoFactorEnabled,
                  notificationsEnabled: profile.notificationsEnabled,
                  notificationPreference: profile.notificationPreference,
                  timezone: profile.timezone
                }}
                onMessage={setMessage}
                onPreferencesChange={(changes) => setProfile(prev => ({ ...prev, ...changes }))}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}