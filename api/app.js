// /api/app.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import logger from "./logger.js";

// Import routes
import adminAuthRoutes from "./routes/v1/adminAuth.js";
import customerAuthRoutes from "./routes/v1/customerAuth.js";
import adminUsersRoutes from "./routes/v1/adminUsers.js";
import systemRoutes from "./routes/v1/system.js";
import productsRoutes from "./routes/v1/products.js";
import productOptionsRoutes from "./routes/v1/productOptions.js";
// import productOptionSKUsRoutes from "./routes/v1/productOptionSKUs.js";
// import productCategoriesRoutes from "./routes/v1/productCategories.js";
// import customersRoutes from "./routes/v1/customers.js";
// import ordersRoutes from "./routes/v1/orders.js";
// import inventoryRoutes from "./routes/v1/inventory.js";
// import shipmentsRoutes from "./routes/v1/shipments.js";

dotenv.config();

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Log incoming requests
app.use((req, res, next) => {
	logger.info(`Incoming request: ${req.method} ${req.url}`);
	next();
});

// Mount the routes with versioning
app.use("/v1/adminAuth", adminAuthRoutes);
app.use("/v1/customerAuth", customerAuthRoutes);
app.use("/v1/adminUsers", adminUsersRoutes);
app.use("/v1/system", systemRoutes);
app.use("/v1/products", productsRoutes);
app.use("/v1/product-options", productOptionsRoutes);
// app.use("/v1/product-option-skus", productOptionSKUsRoutes);
// app.use("/v1/product-categories", productCategoriesRoutes);
// app.use("/v1/customers", customersRoutes);
// app.use("/v1/orders", ordersRoutes);
// app.use("/v1/inventory", inventoryRoutes);
// app.use("/v1/shipments", shipmentsRoutes);

// Base health-check route
app.get("/", (req, res) => {
	res.json({
		status: "ok",
		message: "Free Carver API is running!",
		version: "v1",
	});
});

// Global error handling middleware
app.use((err, req, res, next) => {
	logger.error(`Server error: ${err.message}`, { error: err });
	res.status(500).json({ error: "Internal server error" });
});

export default app;
