-- ============================================
-- Migration File for freecarver_store Database
-- Populate the database with 20 random admin users.
-- All admin users have the same password of 'Abc.123!'
-- Phone numbers are formatted as (123) 456-7890.
-- Each user gets a unique first name and an avatar_url where the
-- seed matches the first name and the backgroundColor is random.
-- Before inserting, delete all old admin user records with an id > 1.
-- ============================================
-- Current Date: February 19, 2025

BEGIN;

-- Enable pgcrypto extension if it's not already enabled (required for the crypt() function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete old admin users with id greater than 1
DELETE FROM admin_users
WHERE id > 1;

-- Ensure at least one role exists (for role_id foreign key)
INSERT INTO admin_roles (role_name)
VALUES ('Admin'), ('Manager'), ('Support')
ON CONFLICT (role_name) DO NOTHING;

-- Use a CTE to build our admin user data with exactly 20 unique users
WITH admin_data AS (
    SELECT DISTINCT ON (first_name) -- Ensure unique first names
        gs,
        'admin' || gs || '@example.com' AS email,
        crypt('Abc.123!', gen_salt('bf')) AS password_hash, -- Blowfish-encrypted password
        (ARRAY[
            'Ryan', 'Brian', 'Easton', 'Sarah', 'Kimberly',
            'Eden', 'Luis', 'Jude', 'Destiny', 'Adrian',
            'Liam', 'Caleb', 'Brooklynn', 'Liliana', 'Sadie',
            'Oliver', 'Robert', 'Sara', 'Jameson', 'Jack'
        ]::text[])[(floor(random() * 20)::int + 1)] AS first_name,
        (ARRAY[
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
            'Davis', 'Garcia', 'Miller', 'Wilson', 'Taylor',
            'Moore', 'Martin', 'Perez', 'Thompson', 'White',
            'Harris', 'Martinez', 'Robinson', 'Clark', 'Rodriguez'
        ]::text[])[floor(random() * 20)::int + 1] AS last_name,
        (
            '(' || LPAD(floor(random() * 900 + 100)::text, 3, '0') || ') ' || -- Area code: 100-999
            LPAD(floor(random() * 900 + 100)::text, 3, '0') || '-' ||         -- Prefix: 100-999
            LPAD(floor(random() * 9000 + 1000)::text, 4, '0')                 -- Line: 1000-9999
        ) AS phone_number
    FROM generate_series(1, 40) gs -- Generate more than 20 to ensure uniqueness, then limit later
    ORDER BY first_name, random() -- Ensure distinct first names with random selection
    LIMIT 20 -- Exactly 20 unique users
)
INSERT INTO admin_users (
    email,
    password_hash,
    first_name,
    last_name,
    phone_number,
    avatar_url,
    timezone,
    role_id,
    mfa_enabled,
    mfa_method
)
SELECT
    email,
    password_hash,
    first_name,
    last_name,
    phone_number,
    'https://api.dicebear.com/9.x/adventurer/svg?seed=' || first_name ||
    '&backgroundColor=' || LPAD(TO_HEX(floor(random() * 16777216)::int), 6, '0') AS avatar_url, -- Random hex color
    'UTC' AS timezone,
    random_role.id AS role_id,
    FALSE AS mfa_enabled, -- Default from schema
    NULL AS mfa_method    -- Default from schema
FROM admin_data
CROSS JOIN LATERAL (
    SELECT id
    FROM admin_roles
    ORDER BY random()
    LIMIT 1
) random_role;

COMMIT;