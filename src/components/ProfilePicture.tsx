import React from 'react';
import { AvatarUpload } from './AvatarUpload';

interface ProfilePictureProps {
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
}

export function ProfilePicture({ avatarUrl, onAvatarChange }: ProfilePictureProps) {
  return (
    <fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
      <legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">Profile Picture</legend>
      <div className="space-y-2">
        <AvatarUpload
          url={avatarUrl}
          onUpload={onAvatarChange}
          size={120}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click to upload. Maximum size: 2MB.
        </p>
      </div>
    </fieldset>
  );
}