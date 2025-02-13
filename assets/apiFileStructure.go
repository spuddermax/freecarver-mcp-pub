/freecarver-mcp
├── migrations/
│   └── 001_create_store_tables.sql       # SQL migration file (schema, triggers, etc.)
├── api/
│   ├── db.js                             # PostgreSQL connection pool (using pg, dotenv)
│   ├── logger.js                         # Logger configuration using Winston
│   ├── app.js                            # Express app configuration (middleware, routes)
│   ├── server.js                         # Server entry point (starts the Express app)
│   ├── seeds/
│   │   └── seedAdmin.js                  # Script to seed initial admin data
│   ├── middleware/
│   │   └── auth.js                       # JWT authentication middleware (shared for admin & customers)
│   ├── routes/
│   │   └── v1/
│   │       ├── adminAuth.js              # Admin authentication endpoints (/login, /me)
│   │       ├── customerAuth.js           # Customer authentication endpoints (/login, /me)
│   │       ├── adminUsers.js             # Admin user management endpoints (CRUD, avatar)
│   │       ├── system.js                 # System endpoints (system preferences, audit logs)
│   │       ├── products.js               # Product endpoints (CRUD, pricing, media)
│   │       ├── productOptions.js         # Product options & variants endpoints (CRUD)
│   │       ├── productOptionSKUs.js      # Product option SKU associations endpoints (CRUD)
│   │       ├── productCategories.js      # Product categories endpoints (CRUD, hierarchy)
│   │       ├── customers.js              # Customer endpoints (CRUD, profile, addresses)
│   │       ├── orders.js                 # Orders endpoints (CRUD, refund handling) with nested order items
│   │       ├── inventory.js              # Inventory endpoints (locations & inventory products, CRUD)
│   │       └── shipments.js              # Shipments endpoints (CRUD) with nested shipment items
│   └── tests/
│       ├── globalSetup.mjs               # Global setup: Drops/recreates test DB, runs migrations
│       ├── globalTeardown.mjs            # Global teardown: Closes connections, drops test DB
│       ├── adminAuth.test.js             # Unit tests for admin authentication endpoints
│       ├── customerAuth.test.js          # Unit tests for customer authentication endpoints
│       ├── adminUsers.test.js            # Unit tests for admin user management endpoints
│       ├── system.test.js                # Unit tests for system endpoints
│       ├── products.test.js              # Unit tests for product endpoints
│       ├── productOptions.test.js        # Unit tests for product options & variants endpoints
│       ├── productOptionSKUs.test.js     # Unit tests for product option SKU endpoints
│       ├── productCategories.test.js     # Unit tests for product categories endpoints
│       ├── customers.test.js             # Unit tests for customer endpoints
│       ├── orders.test.js                # Unit tests for orders and nested order items endpoints
│       └── shipments.test.js             # Unit tests for shipments and nested shipment items endpoints
└── package.json                          # Project dependencies and scripts
