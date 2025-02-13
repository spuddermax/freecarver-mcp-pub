import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadAvatar } from '../lib/api';

interface AvatarUploadProps {
  url: string;
  onUpload: (url: string) => void;
  size?: number;
}

export function AvatarUpload({ url, onUpload, size = 150 }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be less than 2MB');
      }

      // Check file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('File type must be JPEG, PNG, or WebP');
      }

      // Call the new API to upload the avatar
      const result = await uploadAvatar(file, url);
      onUpload(result.publicUrl);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  }, [onUpload, url]);

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
          onChange={handleUpload}
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
