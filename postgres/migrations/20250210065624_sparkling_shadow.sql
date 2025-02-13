/*
  # Update storage bucket for avatars

  1. Changes
    - Ensures avatars bucket exists and is public
    - Safely creates storage policies if they don't exist
    
  2. Security
    - Enables RLS on storage.objects
    - Creates policies for avatar management:
      - Upload policy for authenticated users
      - Update policy for own avatars
      - Delete policy for own avatars
      - Public read access
*/

-- Create avatars bucket if it doesn't exist and ensure it's public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$ 
BEGIN
    -- Upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Authenticated users can upload avatars'
    ) THEN
        CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    -- Update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Authenticated users can update their own avatars'
    ) THEN
        CREATE POLICY "Authenticated users can update their own avatars"
        ON storage.objects FOR UPDATE TO authenticated
        USING (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        )
        WITH CHECK (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    -- Delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Authenticated users can delete their own avatars'
    ) THEN
        CREATE POLICY "Authenticated users can delete their own avatars"
        ON storage.objects FOR DELETE TO authenticated
        USING (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    -- Read policy (public access)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Avatars are publicly readable'
    ) THEN
        CREATE POLICY "Avatars are publicly readable"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
    END IF;
END $$;