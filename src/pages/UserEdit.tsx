import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Toast } from '../components/Toast';
import { UserEmail } from '../components/UserEmail';
import { UserPersonalDetails } from '../components/UserPersonalDetails';
import { UserPicture } from '../components/UserPicture';
import { UserPassword } from '../components/UserPassword';
import { UserPreferences } from '../components/UserPreferences';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserData } from '../lib/api';

export interface UserData {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  createdAt: string;
  phoneNumber: string;
  twoFactorEnabled: boolean;
  notificationsEnabled: boolean;
  notificationPreference: string;
  timezone: string;
}

export default function UserEdit() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  
  // State for messages (for success/error notifications)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Local user state. Note: We use "userData" (lowercase) to avoid confusion with component names.
  const [userData, setUserData] = useState<UserData>({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    avatarUrl: '',
    twoFactorEnabled: false,
    notificationsEnabled: true,
    notificationPreference: 'email',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    role: '',
    createdAt: '',
  });

  // Load user details from the API when the component mounts or when the uuid changes.
  useEffect(() => {
    async function loadUser() {
      if (!uuid) {
        console.log('No UUID provided');
        return;
      }
      try {
        const data = await fetchUserData(uuid);
        // Adjust the property names if your API returns different keys.
        setUserData({
          id: data.id,
          email: data.email || '',
          firstName: data.firstName || data.first_name || '',
          lastName: data.lastName || data.last_name || '',
          phoneNumber: data.phoneNumber || data.phone_number || '',
          avatarUrl: data.avatarUrl || data.avatar_url || '',
          twoFactorEnabled: data.twoFactorEnabled || data.two_factor_enabled || false,
          notificationsEnabled: data.notificationsEnabled ?? data.notifications_enabled ?? true,
          notificationPreference: data.notificationPreference || data.notification_preference || 'email',
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          role: data.role || 'viewer',
          createdAt: new Date(data.createdAt || data.created_at).toLocaleDateString(),
        });
      } catch (error) {
        console.error('Error loading user:', error);
        setMessage({ type: 'error', text: 'Failed to load user details.' });
      }
    }
    loadUser();
  }, [uuid]);

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
              <p className="text-sm text-gray-500">Logged in ID: {userData.id}</p>
              <p className="text-sm text-gray-500">Requested ID: {uuid}</p>
              <UserEmail
                email={userData.email}
                onEmailChange={(email) => setUserData(prev => ({ ...prev, email }))}
                onMessage={setMessage}
              />

              <UserPersonalDetails
                User={{
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  phoneNumber: userData.phoneNumber
                }}
                onMessage={setMessage}
                onUserChange={(changes) => setUserData(prev => ({ ...prev, ...changes }))}
              />

              <UserPicture
                avatarUrl={userData.avatarUrl}
                onAvatarChange={(url) => setUserData(prev => ({ ...prev, avatarUrl: url }))}
              />

              <UserPassword
                email={userData.email}
                onMessage={setMessage}
              />

              <UserPreferences
                preferences={{
                  twoFactorEnabled: userData.twoFactorEnabled,
                  notificationsEnabled: userData.notificationsEnabled,
                  notificationPreference: userData.notificationPreference,
                  timezone: userData.timezone
                }}
                onMessage={setMessage}
                onPreferencesChange={(changes) => setUserData(prev => ({ ...prev, ...changes }))}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
