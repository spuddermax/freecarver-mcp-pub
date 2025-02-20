-- ============================================
-- Migration File for freecarver_store Database
-- Populate the database with 50 Carved Americana products in 4 categories
-- with random inventory levels (between 2 and 100),
-- unique, random product names and descriptions,
-- random options with associated option SKUs for 5 products,
-- and 5 inventory locations with products randomly assigned to the locations.
--
-- This migration clears out interested tables and resets serial fields.
-- ============================================
-- Current Date: February 19, 2025

BEGIN;

-- Clear out the tables and reset identity values
TRUNCATE TABLE product_category_assignments,
              inventory_products,
              product_option_variants,
              product_options,
              products,
              product_categories,
              inventory_locations
RESTART IDENTITY CASCADE;

-- Insert Americana-themed product categories (if they don't already exist)
INSERT INTO product_categories (name, description)
VALUES 
    ('Carved Wood Sculptures', 'Hand-carved wood sculptures inspired by Americana.'),
    ('Americana Collectibles', 'Unique collectibles representing American heritage.'),
    ('Rustic Decor', 'Rustic and charming carved decor items.'),
    ('Heritage Artifacts', 'Artifacts reminiscent of historical Americana charm.')
ON CONFLICT (name) DO NOTHING;

-- Insert 5 inventory locations if they don't exist
INSERT INTO inventory_locations (location_identifier, description)
VALUES 
    ('WAREHOUSE_A', 'Main warehouse location A'),
    ('WAREHOUSE_B', 'Main warehouse location B'),
    ('WAREHOUSE_C', 'Main warehouse location C'),
    ('WAREHOUSE_D', 'Main warehouse location D'),
    ('WAREHOUSE_E', 'Main warehouse location E')
ON CONFLICT (location_identifier) DO NOTHING;

-- Use a DO block to capture the current max product ID and then insert new data
DO $$
DECLARE
    previous_max_id int;
    new_option_id int;
    new_variant_id int;
    rec record;
BEGIN
    -- Capture the current maximum product id to isolate new product inserts
    SELECT COALESCE(MAX(id), 0) INTO previous_max_id FROM products;
    
    -- Insert 50 Carved Americana products with unique, random names and descriptions
    INSERT INTO products (sku, name, description, price, sale_price, sale_start, sale_end, product_media)
    SELECT 
        'PROD-' || LPAD(gs::text, 6, '0') AS sku, -- Unique SKU for each product
        'Carved ' ||
        (ARRAY['Rustic','Vintage','Handcrafted','Heritage'])[floor(random()*4)::int + 1] ||
        ' ' ||
        (ARRAY['Sculpture','Collectible','Decor','Artifact'])[floor(random()*4)::int + 1] ||
        ' ' || gs AS name,
        'A ' ||
        (ARRAY['unique','stunning','exquisite','remarkable'])[floor(random()*4)::int + 1] ||
        ' ' ||
        (ARRAY['masterpiece','creation','work of art','piece'])[floor(random()*4)::int + 1] ||
        ' that combines traditional Americana style with modern flair.' AS description,
        round((random() * 100 + 50)::numeric, 2), -- Base price between 50 and 150
        CASE WHEN random() < 0.3 THEN round((random() * 80 + 40)::numeric, 2) END, -- 30% chance of sale price (40-120)
        CASE WHEN random() < 0.3 THEN NOW() - interval '1 day' * floor(random() * 10) END, -- Sale start (if applicable)
        CASE WHEN random() < 0.3 THEN NOW() + interval '1 day' * floor(random() * 30) END, -- Sale end (if applicable)
        '[]'::jsonb -- Empty media array for simplicity
    FROM generate_series(1, 50) gs;
    
    -- For each of the newly inserted products, assign a random category
    INSERT INTO product_category_assignments (product_id, category_id)
    SELECT p.id,
           (SELECT id FROM product_categories ORDER BY random() LIMIT 1)
    FROM products p
    WHERE p.id > previous_max_id;
    
    -- For each new product, add an inventory record with a random quantity between 2 and 100
    -- and randomly select one of the 5 inventory locations
    INSERT INTO inventory_products (product_id, location_id, quantity)
    SELECT p.id,
           (SELECT id FROM inventory_locations ORDER BY random() LIMIT 1),
           floor(random() * 99)::int + 2
    FROM products p
    WHERE p.id > previous_max_id;
    
    -- For 5 random newly inserted products, insert one product option with an associated variant
    FOR rec IN (
        SELECT id AS product_id
        FROM products
        WHERE id > previous_max_id
        ORDER BY random()
        LIMIT 5
    ) LOOP
        -- Insert a random product option with a unique name tied to the product
        INSERT INTO product_options (product_id, option_name)
        VALUES (
            rec.product_id,
            'Option ' || (ARRAY['Standard','Deluxe','Premium','Limited'])[floor(random()*4)::int + 1] || ' - Product ' || rec.product_id
        )
        RETURNING id INTO new_option_id;
        
        -- Insert a variant for the new option with a unique SKU and price
        INSERT INTO product_option_variants (product_id, option_id, name, sku, price)
        VALUES (
            rec.product_id,
            new_option_id,
            (ARRAY['Red','Blue','Green','Black','White'])[floor(random()*5)::int + 1],
            'SKU-' || rec.product_id || '-' || new_option_id || '-' || floor(random()*10000)::int,
            round((random() * 10 + 5)::numeric, 2) -- Variant price between 5 and 15
        )
        RETURNING id INTO new_variant_id;
        
        -- Optionally assign the variant to inventory (e.g., 50% chance)
        IF random() < 0.5 THEN
            INSERT INTO inventory_products (product_id, product_option_variants_id, location_id, quantity)
            VALUES (
                rec.product_id,
                new_variant_id,
                (SELECT id FROM inventory_locations ORDER BY random() LIMIT 1),
                floor(random() * 99)::int + 2
            );
        END IF;
    END LOOP;
END $$;

COMMIT;