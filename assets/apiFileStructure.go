/api
├── db.js*                   // Database connection file
├── logger.js*              // Logger configuration using Winston
├── middleware/
│   └── auth.js*             // JWT authentication middleware for both admins and customers
├── routes/
│   └── v1/
│       ├── adminAuth.js        // Admin authentication endpoints (login, me, etc.)
│       ├── adminUsers.js       // Admin user management endpoints (CRUD, avatar upload)
│       ├── customerAuth.js     // Customer authentication endpoints (login, me, etc.)
│       ├── system.js           // System preferences and audit log endpoints
│       ├── products.js         // Product endpoints (CRUD, sale pricing, product_media)
│       ├── productOptions.js   // Product options and variant endpoints
│       ├── productOptionSKUs.js// SKU endpoints for product options
│       ├── productCategories.js// Product category endpoints (CRUD, assignments)
│       ├── customers.js        // Customer endpoints (profile, addresses, etc.)
│       ├── orders.js           // Order endpoints (order items, refunds, etc.)
│       ├── inventory.js        // Inventory endpoints (locations, product records)
│       └── shipments.js        // Shipment endpoints (shipments, shipment items)
├── seeds/
│   └── seedAdmin.js          // Seed script for the initial admin user/role
├── server.js*                 // Main entry point for your API server
└── package.json
