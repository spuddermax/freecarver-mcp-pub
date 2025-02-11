import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { Toast } from '../components/Toast';
import { UserEmail } from '../components/UserEmail';
import { UserPersonalDetails } from '../components/UserPersonalDetails';
import { UserPicture } from '../components/UserPicture';
import { UserPassword } from '../components/UserPassword';
import { UserPreferences } from '../components/UserPreferences';
import { useGrid } from '../lib/grid';
import { TronGrid } from '../components/TronGrid/index';

export interface UserData {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  createdAt: string;
  name?: string;
}

interface UserEditProps {
  user: UserData | null;
  onClose: () => void;
  onSave: () => void;
}

export default function UserEdit({ user, onClose, onSave }: UserEditProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [User, setUser] = useState({
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
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata || {};
        setUser({
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
      console.error('Error loading User:', error);
    }
  }

  const fullName = user ? user.name ?? `${user.firstName} ${user.lastName}` : '';

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
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">User Settings Editor</h3>
            </div>

            <div className="p-6 space-y-8">
              <UserEmail
                email={User.email}
                onEmailChange={(email) => setUser(prev => ({ ...prev, email }))}
                onMessage={setMessage}
              />

              <UserPersonalDetails
                User={{
                  firstName: User.firstName,
                  lastName: User.lastName,
                  phoneNumber: User.phoneNumber
                }}
                onMessage={setMessage}
                onUserChange={(changes) => setUser(prev => ({ ...prev, ...changes }))}
              />

              <UserPicture
                avatarUrl={User.avatarUrl}
                onAvatarChange={(url) => setUser(prev => ({ ...prev, avatarUrl: url }))}
              />

              <UserPassword
                email={User.email}
                onMessage={setMessage}
              />

              <UserPreferences
                preferences={{
                  twoFactorEnabled: User.twoFactorEnabled,
                  notificationsEnabled: User.notificationsEnabled,
                  notificationPreference: User.notificationPreference,
                  timezone: User.timezone
                }}
                onMessage={setMessage}
                onPreferencesChange={(changes) => setUser(prev => ({ ...prev, ...changes }))}
              />
            </div>
          </div>
        </div>
      </div>
      <button onClick={onClose}>Close</button>
      <button onClick={onSave}>Save</button>
    </Layout>
  );
}