-- ============================================
-- Migration File for freecarver_store Database
-- Populate the database with 30 orders for a single random product
-- for 30 different customers.
-- Each order uses the same product (selected at random) and its price.
-- A corresponding order_item record is created for each order.
-- ============================================
-- Current Date: February 19, 2025

BEGIN;

DO $$
DECLARE
    v_product_id INTEGER;
    v_product_price NUMERIC(10,2);
    v_order_id INTEGER;
    rec RECORD;
BEGIN
    -- Select one random product along with its price, ensuring it exists
    SELECT id, COALESCE(price, 0.00) -- Default to 0.00 if price is NULL
    INTO v_product_id, v_product_price
    FROM products
    WHERE price IS NOT NULL -- Ensure a valid price exists
    ORDER BY random()
    LIMIT 1;

    -- Raise an exception if no product is found
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'No products found in the database to create orders for.';
    END IF;

    -- For 30 random distinct customers, create order and order item
    FOR rec IN (
        SELECT id AS customer_id
        FROM customers
        ORDER BY random()
        LIMIT 30
    )
    LOOP
        -- Insert into orders with schema-aligned defaults
        INSERT INTO orders (
            customer_id,
            order_date,
            status,
            order_total,
            refund_total,
            refund_date,
            refund_status,
            refund_reason
        )
        VALUES (
            rec.customer_id,
            NOW(),           -- Use order_date default explicitly for clarity
            'pending',       -- Matches schema default
            v_product_price, -- order_total reflects the single item price
            NULL,            -- refund_total nullable
            NULL,            -- refund_date nullable
            'none',          -- Matches schema default
            NULL             -- refund_reason nullable
        )
        RETURNING id INTO v_order_id;

        -- Insert into order_items with the product's price
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price
        )
        VALUES (
            v_order_id,
            v_product_id,
            1,              -- Fixed quantity of 1 per requirement
            v_product_price -- Price from the selected product
        );
    END LOOP;

    -- Handle case where fewer than 30 customers exist
    IF (SELECT COUNT(*) FROM customers) < 30 THEN
        RAISE NOTICE 'Fewer than 30 customers available; only % orders created.', (SELECT COUNT(*) FROM orders WHERE product_id = v_product_id);
    END IF;
END $$;

COMMIT;