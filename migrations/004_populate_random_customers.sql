-- ============================================
-- Migration File for freecarver_store Database
-- Populate the database with 100 random customers.
-- All customers have the same password of 'Cust.1234!'
-- Phone numbers are formatted as (123) 456-7890.
-- Each customer gets a unique first name and an avatar_url where the
-- seed matches the first name and the backgroundColor is random.
-- Before inserting, delete all old customer records.
-- ============================================

BEGIN;

-- Enable pgcrypto extension if it's not already enabled (required for the crypt() function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Truncate the customers table (use with caution in production)
TRUNCATE TABLE customers RESTART IDENTITY CASCADE;

-- Use a CTE to build our customer data
WITH customer_data AS (
  SELECT
    gs,
    'customer' || gs || '@example.com' AS email,
    crypt('Cust.1234!', gen_salt('bf')) AS password_hash,
    (ARRAY[
      'Alice',
      'Bob',
      'Charlie',
      'Diana',
      'Eve',
      'Frank',
      'Grace',
      'Heidi',
      'Ivan',
      'Judy'
    ])[((gs - 1) % 10) + 1] AS first_name,
    (ARRAY[
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Miller',
      'Davis',
      'Garcia',
      'Rodriguez',
      'Martinez'
    ])[floor(random() * 10)::int + 1] AS last_name,
    '(' || ((floor(random() * 900)::int + 100))::text || ') ' ||
    ((floor(random() * 900)::int + 100))::text || '-' ||
    ((floor(random() * 9000)::int + 1000))::text AS phone_number,
    'https://api.dicebear.com/9.x/adventurer/svg?seed=' ||
      (ARRAY[
        'Alice',
        'Bob',
        'Charlie',
        'Diana',
        'Eve',
        'Frank',
        'Grace',
        'Heidi',
        'Ivan',
        'Judy'
      ])[((gs - 1) % 10) + 1] ||
      '&backgroundColor=' || lpad(to_hex(floor(random()*16777216)::int), 6, '0') AS avatar_url,
    'UTC' AS timezone
  FROM generate_series(1, 100) gs
)
INSERT INTO customers (email, password_hash, first_name, last_name, phone_number, avatar_url, timezone)
SELECT email, password_hash, first_name, last_name, phone_number, avatar_url, timezone
FROM customer_data;

COMMIT; 