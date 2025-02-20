-- ============================================
-- Migration File for freecarver_store Database
-- Add two product options (Size and Color), add 4 variants for each,
-- and apply all the option and variant combinations to the product with id 17.
-- ============================================
-- Current Date: February 19, 2025

BEGIN;

--------------------------------------------------------------
-- 1. Insert Product Options for product ID 17 if they do not already exist.
--------------------------------------------------------------
INSERT INTO product_options (product_id, option_name)
VALUES 
    (17, 'Size'),
    (17, 'Color')
ON CONFLICT (product_id, option_name) DO NOTHING; -- Unique constraint on (product_id, option_name)

--------------------------------------------------------------
-- 2. Insert Product Option Variants for "Size" and "Color".
--------------------------------------------------------------
-- For Size, variants: 'Small', 'Medium', 'Large', 'X-Large'
WITH size_option AS (
    SELECT id
    FROM product_options
    WHERE product_id = 17 AND option_name = 'Size'
    LIMIT 1
)
INSERT INTO product_option_variants (product_id, option_id, name, sku, price)
SELECT 
    17 AS product_id,
    so.id AS option_id,
    v.val AS name,
    CONCAT('SKU-17-', v.val) AS sku, -- Unique SKU per size variant
    round((random() * 10 + 50)::numeric, 2) AS price -- Random price between 50 and 60
FROM size_option so,
    (VALUES 
        ('Small'),
        ('Medium'),
        ('Large'),
        ('X-Large')
    ) AS v (val)
ON CONFLICT (option_id, name) DO NOTHING;

-- For Color, variants: 'Red', 'Green', 'Blue', 'Black'
WITH color_option AS (
    SELECT id
    FROM product_options
    WHERE product_id = 17 AND option_name = 'Color'
    LIMIT 1
)
INSERT INTO product_option_variants (product_id, option_id, name, sku, price)
SELECT 
    17 AS product_id,
    co.id AS option_id,
    v.val AS name,
    CONCAT('SKU-17-', v.val) AS sku, -- Unique SKU per color variant
    round((random() * 10 + 50)::numeric, 2) AS price -- Random price between 50 and 60
FROM color_option co,
    (VALUES 
        ('Red'),
        ('Green'),
        ('Blue'),
        ('Black')
    ) AS v (val)
ON CONFLICT (option_id, name) DO NOTHING;

--------------------------------------------------------------
-- 3. For product with ID 17, insert variant combinations for all Size and Color pairs.
--    Each combination gets a unique SKU (e.g., '17-Small-Red').
--------------------------------------------------------------
WITH size_option AS (
    SELECT id AS option_id
    FROM product_options
    WHERE product_id = 17 AND option_name = 'Size'
    LIMIT 1
),
color_option AS (
    SELECT id AS option_id
    FROM product_options
    WHERE product_id = 17 AND option_name = 'Color'
    LIMIT 1
),
size_variants AS (
    SELECT id, name
    FROM product_option_variants
    WHERE option_id = (SELECT option_id FROM size_option)
),
color_variants AS (
    SELECT id, name
    FROM product_option_variants
    WHERE option_id = (SELECT option_id FROM color_option)
),
-- Generate all combinations without duplicating existing variants
combinations AS (
    SELECT 
        sv.name AS size_name,
        cv.name AS color_name,
        CONCAT('17-', sv.name, '-', cv.name) AS combined_sku
    FROM size_variants sv
    CROSS JOIN color_variants cv
)
INSERT INTO product_option_variants (product_id, option_id, name, sku, price)
SELECT 
    17 AS product_id,
    so.option_id, -- Using Size option_id for the combination
    CONCAT(c.size_name, ' ', c.color_name) AS name, -- e.g., "Small Red"
    c.combined_sku AS sku,
    round((random() * 20 + 60)::numeric, 2) AS price -- Slightly higher price for combinations (60-80)
FROM combinations c,
    size_option so
ON CONFLICT (option_id, name) DO NOTHING;

COMMIT;