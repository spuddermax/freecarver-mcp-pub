import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { Toast } from '../components/Toast';
import { UserEmail } from '../components/UserEmail';
import { UserPersonalDetails } from '../components/UserPersonalDetails';
import { UserPicture } from '../components/UserPicture';
import { UserPassword } from '../components/UserPassword';
import { UserPreferences } from '../components/UserPreferences';
import { useParams } from 'react-router-dom';

interface UserEditProps {
  onClose: () => void;
  onSave: (user: any) => void;
}

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

export default function UserEdit() {
  const { uuid } = useParams<{ uuid: string }>();

  useEffect(() => {
    if (uuid) {
      console.log(uuid);
    }
  }, [uuid]);

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [User, setUser] = useState({
    id: '',
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
    if (uuid) {
      loadUser();
    }
  }, [uuid]);

  async function loadUser() {
    if (!uuid) {
      console.error('No UUID provided');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata || {};
        setUser({
          id: user.id,
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
      console.error('Error loading user:', error);
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

            <div className="p-6 space-y-8">
              <p className="text-sm text-gray-500">Logged in ID: {User.id}</p>
              <p className="text-sm text-gray-500">Requested ID: {uuid}</p>
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
    </Layout>
  );
}