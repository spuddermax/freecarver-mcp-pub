# Database Migrations

This directory contains database migration scripts for FreeCarver MCP.

## Available Migrations

### 1. Initial Database Schema (`001_create_store_tables.sql`)

-   Initial database schema for the FreeCarver store
-   Creates all tables, constraints, and indexes

### 2. BIGINT Migration for Product Options (`002_alter_product_options_bigint.sql`)

-   Converts product_options and product_option_variants id fields from INTEGER to BIGINT
-   Resolves issue with timestamp-based IDs exceeding PostgreSQL INTEGER limits
-   **Required when:** If you're using timestamp-based IDs (like those generated with `Date.now()`) in your frontend

## How to Apply Migrations

### Option 1: Using the Migration Script

For the BIGINT migration, we've created a helper script:

```bash
# From the api directory
npm run migrate:bigint
```

### Option 2: Manually Apply a Migration

You can also apply migrations manually:

1. Connect to your PostgreSQL database using psql:

    ```bash
    psql -U your_username -d your_database
    ```

2. Run the SQL file directly:
    ```sql
    \i /path/to/migration_file.sql
    ```

## Important Notes

-   Always back up your database before applying migrations
-   Migrations should be applied in order
-   The BIGINT migration (`002_alter_product_options_bigint.sql`) should be applied if you're encountering "value out of range for type integer" errors with product options
