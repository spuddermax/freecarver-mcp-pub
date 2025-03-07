import React, { createContext, useContext, useState, useEffect } from 'react';
import { decodeJWT } from './helpers';

interface UserContextType {
  userMySettings: {
    adminId: string;
    adminFirstName: string;
    adminLastName: string;
    adminRoleName: string;
    avatarUrl: string;
  };
  updateUserSettings: (updates: Partial<UserContextType['userMySettings']>) => void;
  refreshUserSettings: () => void;
}

const defaultUserContext: UserContextType = {
  userMySettings: {
    adminId: '',
    adminFirstName: '',
    adminLastName: '',
    adminRoleName: '',
    avatarUrl: '',
  },
  updateUserSettings: () => {},
  refreshUserSettings: () => {},
};

const UserContext = createContext<UserContextType>(defaultUserContext);

export const useUserContext = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userMySettings, setUserMySettings] = useState(defaultUserContext.userMySettings);
  
  const updateUserSettings = (updates: Partial<UserContextType['userMySettings']>) => {
    setUserMySettings(prev => ({ ...prev, ...updates }));
  };
  
  const refreshUserSettings = () => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.adminId) {
        setUserMySettings({
          adminId: decoded.adminId || '',
          adminFirstName: decoded.adminFirstName || '',
          adminLastName: decoded.adminLastName || '',
          adminRoleName: decoded.adminRoleName || '',
          avatarUrl: decoded.adminAvatarUrl || '',
        });
      }
    }
  };

  useEffect(() => {
    refreshUserSettings();
  }, []);

  return (
    <UserContext.Provider value={{ userMySettings, updateUserSettings, refreshUserSettings }}>
      {children}
    </UserContext.Provider>
  );
}; 