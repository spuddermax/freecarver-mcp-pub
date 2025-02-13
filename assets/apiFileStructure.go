/freecarver-mcp
├── migrations
│   └── 001_create_store_tables.sql
├── api
│   ├── db.js
│   ├── logger.js
│   ├── app.js             // Exports the Express app (used by tests and server)
│   ├── server.js          // Starts the server
│   ├── seeds
│   │   └── seedAdmin.js
│   ├── middleware
│   │   └── auth.js        // JWT authentication middleware (used by both admin and customer routes)
│   ├── routes
│   │   └── v1
│   │       ├── adminAuth.js      // Admin authentication endpoints (/login and /me)
│   │       ├── customerAuth.js   // Customer authentication endpoints (/login and /me)
│   │       ├── adminUsers.js     // Endpoints for admin user management (CRUD, avatar, etc.)
│   │       ├── system.js         // System preferences and audit log endpoints
│   │       ├── products.js       // Product endpoints (CRUD, sale pricing, product_media)
│   │       ├── productOptions.js // Product options and variants endpoints
│   │       ├── productOptionSKUs.js // SKU endpoints for product options
│   │       ├── productCategories.js // Product category endpoints (CRUD, assignments)
│   │       ├── customers.js      // Customer endpoints (profile, addresses, etc.)
│   │       ├── orders.js         // Order endpoints (order items, refunds, etc.)
│   │       ├── inventory.js      // Inventory endpoints (locations, product records)
│   │       └── shipments.js      // Shipment endpoints (shipments, shipment items)
│   └── tests
│       ├── adminAuth.test.js       // Unit tests for admin authentication routes
│       ├── customerAuth.test.js    // Unit tests for customer authentication routes
│       ├── globalSetup.mjs         // Global setup: drops, re-creates, and migrates the test database
│       └── globalTeardown.mjs      // Global teardown: drops the test database after tests complete
└── package.json
