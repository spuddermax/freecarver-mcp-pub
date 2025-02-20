-- ============================================
-- Migration File for freecarver_store Database
-- Populate the database with 100 random customers.
-- All customers have the same password of 'Cust.1234!'
-- Phone numbers are formatted as (123) 456-7890.
-- Each customer gets a unique first name and an avatar_url where the
-- seed matches the first_name and the backgroundColor is random.
-- Before inserting, delete all old customer records.
-- ============================================
-- Current Date: February 19, 2025

BEGIN;

-- Enable pgcrypto extension if it's not already enabled (required for the crypt() function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Truncate the customers table (use with caution in production)
TRUNCATE TABLE customers RESTART IDENTITY CASCADE;

-- Use a CTE to build our customer data with distinct first names
WITH customer_data AS (
    SELECT DISTINCT ON (first_name) -- Ensure unique first names where possible
        gs,
        'customer' || LPAD(gs::text, 5, '0') || '@example.com' AS email, -- Unique email (e.g., customer00001@example.com)
        crypt('Cust.1234!', gen_salt('bf')) AS password_hash, -- Blowfish-encrypted password
        (ARRAY[
            'Alice', 'Bob', 'Charlie', 'Diana', 'Eve',
            'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
            'Kelly', 'Liam', 'Mia', 'Noah', 'Olivia',
            'Peter', 'Quinn', 'Rose', 'Sam', 'Tara',
            'Uma', 'Victor', 'Wendy', 'Xander', 'Yara',
            'Zoe', 'Aaron', 'Bella', 'Caleb', 'Daisy',
            'Ethan', 'Fiona', 'Gabe', 'Holly', 'Ian',
            'Jade', 'Kara', 'Leo', 'Milo', 'Nora',
            'Owen', 'Pia', 'Raul', 'Sofia', 'Tom',
            'Uma', 'Vera', 'Will', 'Xena', 'Yuri',
            'Zara', 'Adam', 'Beth', 'Cole', 'Dean',
            'Ella', 'Finn', 'Gina', 'Hank', 'Iris',
            'Jack', 'Kyla', 'Lena', 'Max', 'Nina',
            'Omar', 'Phoebe', 'Reed', 'Sara', 'Tina',
            'Ugo', 'Vince', 'Wade', 'Xavi', 'Yvonne',
            'Zach', 'Ava', 'Ben', 'Clara', 'Dylan',
            'Emma', 'Fred', 'Gwen', 'Hugh', 'Ida',
            'Jake', 'Kira', 'Luke', 'Maya', 'Nate',
            'Opal', 'Paul', 'Ruth', 'Sean', 'Tessa',
            'Uriel', 'Vera', 'Walt', 'Xena', 'Yara'
        ]::text[])[floor(random() * 100)::int + 1] AS first_name,
        (ARRAY[
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
            'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Martinez',
            'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
            'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
        ]::text[])[floor(random() * 20)::int + 1] AS last_name,
        (
            '(' || LPAD(floor(random() * 900 + 100)::text, 3, '0') || ') ' || -- Area code: 100-999
            LPAD(floor(random() * 900 + 100)::text, 3, '0') || '-' ||         -- Prefix: 100-999
            LPAD(floor(random() * 9000 + 1000)::text, 4, '0')                 -- Line: 1000-9999
        ) AS phone_number,
        'https://api.dicebear.com/9.x/adventurer/svg?seed=' || 
        (ARRAY[
            'Alice', 'Bob', 'Charlie', 'Diana', 'Eve',
            'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
            'Kelly', 'Liam', 'Mia', 'Noah', 'Olivia',
            'Peter', 'Quinn', 'Rose', 'Sam', 'Tara',
            'Uma', 'Victor', 'Wendy', 'Xander', 'Yara',
            'Zoe', 'Aaron', 'Bella', 'Caleb', 'Daisy',
            'Ethan', 'Fiona', 'Gabe', 'Holly', 'Ian',
            'Jade', 'Kara', 'Leo', 'Milo', 'Nora',
            'Owen', 'Pia', 'Raul', 'Sofia', 'Tom',
            'Uma', 'Vera', 'Will', 'Xena', 'Yuri',
            'Zara', 'Adam', 'Beth', 'Cole', 'Dean',
            'Ella', 'Finn', 'Gina', 'Hank', 'Iris',
            'Jack', 'Kyla', 'Lena', 'Max', 'Nina',
            'Omar', 'Phoebe', 'Reed', 'Sara', 'Tina',
            'Ugo', 'Vince', 'Wade', 'Xavi', 'Yvonne',
            'Zach', 'Ava', 'Ben', 'Clara', 'Dylan',
            'Emma', 'Fred', 'Gwen', 'Hugh', 'Ida',
            'Jake', 'Kira', 'Luke', 'Maya', 'Nate',
            'Opal', 'Paul', 'Ruth', 'Sean', 'Tessa',
            'Uriel', 'Vera', 'Walt', 'Xena', 'Yara'
        ]::text[])[floor(random() * 100)::int + 1] || 
        '&backgroundColor=' || LPAD(TO_HEX(floor(random() * 16777216)::int), 6, '0') AS avatar_url,
        'UTC' AS timezone
    FROM generate_series(1, 120) gs -- Generate extra rows to ensure 100 unique first names
    ORDER BY first_name, random()
    LIMIT 100 -- Exactly 100 customers
)
INSERT INTO customers (
    email,
    password_hash,
    first_name,
    last_name,
    phone_number,
    avatar_url,
    timezone
)
SELECT
    email,
    password_hash,
    first_name,
    last_name,
    phone_number,
    avatar_url,
    timezone
FROM customer_data;

COMMIT;