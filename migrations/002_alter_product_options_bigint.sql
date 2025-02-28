-- ============================================
-- Migration File to alter product_options and product_option_variants tables
-- Convert id columns from INTEGER/SERIAL to BIGINT to support timestamp-based IDs
-- ============================================
-- Current Date: February 27, 2025

-- 1. Add temporary columns to avoid constraint issues
ALTER TABLE product_option_variants 
ADD COLUMN temp_id BIGINT,
ADD COLUMN temp_option_id BIGINT;

-- 2. Create new sequence with BIGINT
CREATE SEQUENCE IF NOT EXISTS product_options_id_seq_bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS product_option_variants_id_seq_bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 3. Copy data to temporary columns
UPDATE product_option_variants SET temp_id = id, temp_option_id = option_id;

-- 4. Drop constraints and references
ALTER TABLE product_option_variants
DROP CONSTRAINT product_option_variants_option_id_fkey;

-- 5. Alter product_options table
ALTER TABLE product_options 
ALTER COLUMN id TYPE BIGINT,
ALTER COLUMN id SET DEFAULT nextval('product_options_id_seq_bigint'::regclass);

-- 6. Alter product_option_variants table
ALTER TABLE product_option_variants
DROP COLUMN option_id,
ALTER COLUMN id TYPE BIGINT,
ALTER COLUMN id SET DEFAULT nextval('product_option_variants_id_seq_bigint'::regclass);

-- 7. Rename temporary column to real column
ALTER TABLE product_option_variants
ADD COLUMN option_id BIGINT;

-- 8. Copy data back
UPDATE product_option_variants SET option_id = temp_option_id;

-- 9. Make option_id NOT NULL and add foreign key constraint
ALTER TABLE product_option_variants 
ALTER COLUMN option_id SET NOT NULL,
ADD CONSTRAINT product_option_variants_option_id_fkey
FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE;

-- 10. Drop temporary columns
ALTER TABLE product_option_variants
DROP COLUMN temp_id,
DROP COLUMN temp_option_id;

-- 11. Update sequences ownership
ALTER SEQUENCE product_options_id_seq_bigint OWNED BY product_options.id;
ALTER SEQUENCE product_option_variants_id_seq_bigint OWNED BY product_option_variants.id; 