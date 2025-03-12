-- ============================================
-- Migration: Add hero_image to product_categories
-- ============================================
-- Current Date: 2025-06-10

-- Add hero_image column to product_categories table
ALTER TABLE product_categories 
ADD COLUMN hero_image TEXT;

-- Add comment to describe the purpose of this column
COMMENT ON COLUMN product_categories.hero_image IS 'URL or path to the hero image displayed at the top of the category page';

-- Update the updated_at timestamps for all existing records to show they've been modified
UPDATE product_categories
SET updated_at = NOW();

-- Log the migration in the audit_logs table
INSERT INTO audit_logs (crud_action, details)
VALUES ('SCHEMA_CHANGE', 'Added hero_image column to product_categories table via migration 007'); 