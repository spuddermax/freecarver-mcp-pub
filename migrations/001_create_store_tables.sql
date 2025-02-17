-- ============================================
-- Migration File for freecarver_store Database
-- (Includes sale pricing, product media as JSONB, customer addresses,
--  orders with order_total, and shipments/shipment_items)
-- ============================================
-- 1. Create trigger function for auto-updating the updated_at column.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

----------------------------------------------------------
-- 2. CREATE TABLES in Dependency Order
----------------------------------------------------------
-- Table: system_preferences (Independent)
CREATE TABLE IF NOT EXISTS
    system_preferences (
        key TEXT PRIMARY KEY,
        value TEXT,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: admin_roles (Independent)
CREATE TABLE IF NOT EXISTS
    admin_roles (
        id SERIAL PRIMARY KEY,
        role_name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: product_options (Independent)
CREATE TABLE IF NOT EXISTS
    product_options (
        id SERIAL PRIMARY KEY,
        option_name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: product_categories (Independent)
CREATE TABLE IF NOT EXISTS
    product_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        parent_category_id INTEGER REFERENCES product_categories (id),
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: products (Independent)
CREATE TABLE IF NOT EXISTS
    products (
        id SERIAL PRIMARY KEY,
        sku TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(10, 2), -- Allow null if pricing is defined at variant level
        sale_price NUMERIC(10, 2), -- Optional sale price at product level
        sale_start TIMESTAMPTZ, -- Sale start time
        sale_end TIMESTAMPTZ, -- Sale end time
        product_media JSONB, -- JSON storing media objects (URLs, titles, captions, etc.)
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: customers (Independent)
CREATE TABLE IF NOT EXISTS
    customers (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        phone_number TEXT,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        timezone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: customer_addresses (Multiple addresses per customer)
CREATE TABLE IF NOT EXISTS
    customer_addresses (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers (id),
        label TEXT, -- Optional label (e.g., 'Home', 'Office')
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT,
        postal_code TEXT,
        country TEXT NOT NULL,
        address_type TEXT NOT NULL, -- e.g., 'shipping' or 'billing'
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: inventory_locations (Independent)
CREATE TABLE IF NOT EXISTS
    inventory_locations (
        id SERIAL PRIMARY KEY,
        location_identifier TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: admin_users (Depends on admin_roles)
CREATE TABLE IF NOT EXISTS
    admin_users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone_number TEXT,
        avatar_url TEXT,
        timezone TEXT,
        role_id INTEGER NOT NULL REFERENCES admin_roles (id),
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_method TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: orders (Depends on customers)
CREATE TABLE IF NOT EXISTS
    orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers (id),
        order_date TIMESTAMPTZ DEFAULT NOW (),
        status TEXT,
        order_total NUMERIC(10, 2) NOT NULL,
        refund_total NUMERIC(10, 2), -- Total refunded amount, if any
        refund_date TIMESTAMPTZ, -- When the refund was processed
        refund_status TEXT DEFAULT 'none', -- e.g., 'none', 'requested', 'approved', 'denied'
        refund_reason TEXT, -- Optional reason or notes for the refund
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: product_option_variants (Depends on product_options)
CREATE TABLE IF NOT EXISTS
    product_option_variants (
        id SERIAL PRIMARY KEY,
        option_id INTEGER NOT NULL REFERENCES product_options (id),
        option_value TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW (),
        UNIQUE (option_id, option_value)
    );

-- Table: inventory_products (Depends on products and inventory_locations)
CREATE TABLE IF NOT EXISTS
    inventory_products (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products (id),
        location_id INTEGER NOT NULL REFERENCES inventory_locations (id),
        quantity INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: order_items (Depends on orders and products)
CREATE TABLE IF NOT EXISTS
    order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders (id),
        product_id INTEGER NOT NULL REFERENCES products (id),
        quantity INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: product_option_skus (Depends on products, product_options, and product_option_variants)
CREATE TABLE IF NOT EXISTS
    product_option_skus (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products (id),
        option_id INTEGER NOT NULL REFERENCES product_options (id),
        variant_id INTEGER NOT NULL REFERENCES product_option_variants (id),
        price NUMERIC(10, 2), -- Option-specific price (nullable)
        sale_price NUMERIC(10, 2), -- Optional sale price for variant
        sale_start TIMESTAMPTZ, -- Sale start time for variant
        sale_end TIMESTAMPTZ, -- Sale end time for variant
        sku TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW (),
        UNIQUE (product_id, option_id, variant_id)
    );

-- Table: product_category_assignments (Depends on products and product_categories)
CREATE TABLE IF NOT EXISTS
    product_category_assignments (
        product_id INTEGER NOT NULL REFERENCES products (id),
        category_id INTEGER NOT NULL REFERENCES product_categories (id),
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW (),
        PRIMARY KEY (product_id, category_id)
    );

-- Table: audit_logs (Optional FKs to admin_users and customers)
CREATE TABLE IF NOT EXISTS
    audit_logs (
        id SERIAL PRIMARY KEY,
        admin_user_id INTEGER REFERENCES admin_users (id),
        customer_id INTEGER REFERENCES customers (id),
        crud_action TEXT,
        details TEXT NOT NULL,
        ip_address inet,
        created_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: shipments (Depends on orders)
CREATE TABLE IF NOT EXISTS
    shipments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders (id),
        shipment_date TIMESTAMPTZ DEFAULT NOW (),
        tracking_number TEXT,
        shipping_carrier TEXT,
        status TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW ()
    );

-- Table: shipment_items (Depends on shipments and order_items)
CREATE TABLE IF NOT EXISTS
    shipment_items (
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER NOT NULL REFERENCES shipments (id),
        order_item_id INTEGER NOT NULL REFERENCES order_items (id),
        quantity_shipped INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW (),
        updated_at TIMESTAMPTZ DEFAULT NOW (),
        UNIQUE (shipment_id, order_item_id)
    );

----------------------------------------------------------
-- 3. CREATE TRIGGERS to Auto-Update updated_at Columns
----------------------------------------------------------
CREATE TRIGGER update_system_preferences_updated_at BEFORE
UPDATE ON system_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_admin_roles_updated_at BEFORE
UPDATE ON admin_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_product_options_updated_at BEFORE
UPDATE ON product_options FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_product_categories_updated_at BEFORE
UPDATE ON product_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_products_updated_at BEFORE
UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_customers_updated_at BEFORE
UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_customer_addresses_updated_at BEFORE
UPDATE ON customer_addresses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_inventory_locations_updated_at BEFORE
UPDATE ON inventory_locations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_admin_users_updated_at BEFORE
UPDATE ON admin_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_orders_updated_at BEFORE
UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_product_option_variants_updated_at BEFORE
UPDATE ON product_option_variants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_inventory_products_updated_at BEFORE
UPDATE ON inventory_products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_order_items_updated_at BEFORE
UPDATE ON order_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_product_option_skus_updated_at BEFORE
UPDATE ON product_option_skus FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_product_category_assignments_updated_at BEFORE
UPDATE ON product_category_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_shipments_updated_at BEFORE
UPDATE ON shipments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();

CREATE TRIGGER update_shipment_items_updated_at BEFORE
UPDATE ON shipment_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column ();