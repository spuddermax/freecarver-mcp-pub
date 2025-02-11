import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AvatarUploadProps {
  url: string;
  onUpload: (url: string) => void;
  size?: number;
}

export function AvatarUpload({ url, onUpload, size = 150 }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      let oldAvatarPath = null;

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      // Extract path from current avatar URL if it exists
      if (url) {
        try {
          const urlObj = new URL(url);
          const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/avatars\/(.*)/);
          if (pathMatch && pathMatch[1]) {
            oldAvatarPath = decodeURIComponent(pathMatch[1]);
          }
        } catch (error) {
          console.error('Error parsing old avatar URL:', error);
        }
      }
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be less than 2MB');
      }

      // Check file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('File type must be JPEG, PNG, or WebP');
      }

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Delete old avatar if it exists
      if (oldAvatarPath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([oldAvatarPath]);

        if (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Don't throw error here, as the upload was successful
        }
      }
      
      // Update user metadata with new avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      
      if (updateError) {
        throw updateError;
      }
      
      onUpload(publicUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  return (
    <div className="flex flex-col gap-4">
      <div 
        className="relative group"
        style={{ width: size, height: size }}
      >
        {url ? (
          <img
            src={url}
            alt="Avatar"
            className="rounded-full object-cover w-full h-full"
            style={{ width: size, height: size }}
          />
        ) : (
          <div 
            className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        <label 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          htmlFor="avatar-upload"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-white" />
          )}
        </label>
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-3 py-2 rounded-md max-w-fit">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}