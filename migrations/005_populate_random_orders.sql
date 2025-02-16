-- ============================================
-- Migration File for freecarver_store Database
-- Populate the database with 30 orders for a single random product
-- for 30 different customers.
-- Each order uses the same product (selected at random) and its price.
-- A corresponding order_item record is created for each order.
-- ============================================

BEGIN;

DO $$
DECLARE
  v_product_id INTEGER;
  v_product_price NUMERIC(10,2);
  v_order_id INTEGER;
  rec RECORD;
BEGIN
  -- Select one random product along with its price.
  SELECT id, price
  INTO v_product_id, v_product_price
  FROM products
  ORDER BY random()
  LIMIT 1;

  -- For 30 random distinct customers, create order and order item.
  FOR rec IN (
    SELECT id AS customer_id
    FROM customers
    ORDER BY random()
    LIMIT 30
  )
  LOOP
    INSERT INTO orders (customer_id, status, order_total, refund_total, refund_date, refund_status, refund_reason)
    VALUES (rec.customer_id, 'pending', v_product_price, NULL, NULL, 'none', NULL)
    RETURNING id INTO v_order_id;
    
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (v_order_id, v_product_id, 1, v_product_price);
  END LOOP;
END $$;

COMMIT; 