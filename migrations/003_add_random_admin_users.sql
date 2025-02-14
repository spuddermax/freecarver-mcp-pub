-- ============================================
-- Migration File for freecarver_store Database
-- Populate the database with 20 random admin users.
-- All admin users have the same password of 'Abc.123!'
-- Phone numbers are formatted as (123) 456-7890.
-- Each user gets a unique first name and an avatar_url where the
-- seed matches the first name and the backgroundColor is random.
-- Before inserting, delete all old admin user records with an id > 1.
-- ============================================

BEGIN;

-- Enable pgcrypto extension if it's not already enabled (required for the crypt() function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete old admin users with id greater than 1
DELETE FROM admin_users
WHERE id > 1;

-- Use a CTE to build our admin user data
WITH admin_data AS (
  SELECT
    gs,
    'admin' || gs || '@example.com' AS email,
    crypt('Abc.123!', gen_salt('bf')) AS password_hash,
    (ARRAY[
      'Ryan',
      'Brian',
      'Easton',
      'Sarah',
      'Kimberly',
      'Eden',
      'Luis',
      'Jude',
      'Destiny',
      'Adrian',
      'Liam',
      'Caleb',
      'Brooklynn',
      'Liliana',
      'Sadie',
      'Oliver',
      'Robert',
      'Sara',
      'Jameson',
      'Jack'
      'Ryan',
      'Brian',
      'Easton',
      'Sarah',
      'Kimberly',
      'Eden',
      'Luis',
      'Jude',
      'Destiny',
      'Adrian',
      'Liam',
      'Caleb',
      'Brooklynn',
      'Liliana',
      'Sadie',
      'Oliver',
      'Robert',
      'Sara',
      'Jameson',
      'Jack',
      'Ryan'
    ]::text[])[gs] AS first_name,
    (ARRAY[
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Davis',
      'Garcia',
      'Miller',
      'Wilson',
      'Taylor',
      'Moore',
      'Martin',
      'Perez',
      'Thompson',
      'White',
      'Harris',
      'Martinez',
      'Robinson',
      'Clark',
      'Rodriguez',
      'Lewis',
      'Lee',
      'Walker',
      'Hall',
      'Allen',
      'Young',
      'Hernandez',
      'King',
      'Wright'
    ]::text[])[floor(random()*10)::int + 1] AS last_name,
    (
      '(' || ((floor(random() * 900)::int + 100))::text || ') ' ||
      ((floor(random() * 900)::int + 100))::text || '-' ||
      ((floor(random() * 9000)::int + 1000))::text
    ) AS phone_number
  FROM generate_series(1, 40) gs
)
INSERT INTO admin_users (email, password_hash, first_name, last_name, phone_number, avatar_url, timezone, role_id)
SELECT
  email,
  password_hash,
  first_name,
  last_name,
  phone_number,
  'https://api.dicebear.com/9.x/adventurer/svg?seed=' || first_name ||
    '&backgroundColor=' || lpad(to_hex(floor(random()*16777216)::int), 6, '0') AS avatar_url,
  'UTC' AS timezone,
  random_role.id AS role_id
FROM admin_data
CROSS JOIN LATERAL (
  SELECT id
  FROM admin_roles
  WHERE admin_data.gs = admin_data.gs  -- trivial correlation to force per-row evaluation
  ORDER BY random()
  LIMIT 1
) random_role;

COMMIT; 