/*
  # Fix avatar storage access

  1. Changes
    - Make avatars bucket public
    - Update select policy to allow public access
    - Set file size limits and MIME types

  2. Security
    - Maintains existing RLS policies for write operations
    - Only modifies read access to be public
*/

-- Update avatars bucket to be public and configure CORS
UPDATE storage.buckets
SET public = true,
    file_size_limit = 2097152, -- 2MB in bytes
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

-- Drop the existing select policy
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;

-- Create new public select policy (without WITH CHECK clause)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');