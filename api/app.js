// /api/app.js

import express from "express";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cors from "cors";
import { logRequest } from "./middleware/logger.js"; // Corrected import
import ipWhitelistMiddleware from "./middleware/ipWhitelist.js";

// Import routes
import adminAuthRoutes from "./routes/v1/adminAuth.js";
import customerAuthRoutes from "./routes/v1/customerAuth.js";
import adminUsersRoutes from "./routes/v1/adminUsers.js";
import systemRoutes from "./routes/v1/system.js";
import productsRoutes from "./routes/v1/products.js";
import productOptionsRoutes from "./routes/v1/productOptions.js";
import productCategoriesRoutes from "./routes/v1/productCategories.js";
import customersRoutes from "./routes/v1/customers.js";
import ordersRoutes from "./routes/v1/orders.js";
import inventoryRoutes from "./routes/v1/inventory.js";
import shipmentsRoutes from "./routes/v1/shipments.js";
import adminAvatarRoutes from "./routes/v1/adminAvatar.js";
import responseFormatter from "./middleware/responseFormatter.js";

dotenv.config();

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Apply request logging middleware globally
app.use(logRequest);

// Set up a rate limiter: maximum of 100 requests per 5 minutes per IP
const apiLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: async (req, res) => {
		req.log("info", `Rate limit exceeded for IP: ${req.ip}`);
		return "Too many requests from this IP, please try again later.";
	},
});

// Apply the response formatter middleware before your routes
app.use(responseFormatter);

// Apply the rate limiter to API calls starting with '/v1'
app.use("/v1", apiLimiter);

// Add configurable response delay for testing UI
const responseDelay = parseInt(process.env.RESPONSE_DELAY_MS || "0");
if (responseDelay > 0) {
	app.use((req, res, next) => {
		req.log("info", `Adding artificial delay of ${responseDelay}ms`);
		setTimeout(next, responseDelay);
	});
}

// If your API is behind a proxy, enable trust proxy for correct IP extraction.
//app.set("trust proxy", true);

// Log incoming requests with IP address
app.use((req, res, next) => {
	req.log("info", `Incoming request: ${req.method} ${req.url}`);
	next();
});

// Use the IP whitelist middleware for **all** API routes.
app.use(ipWhitelistMiddleware);

// Mount the routes with versioning
app.use("/v1/adminAuth", adminAuthRoutes);
app.use("/v1/customerAuth", customerAuthRoutes);
app.use("/v1/adminUsers", adminUsersRoutes);
app.use("/v1/system", systemRoutes);
app.use("/v1/products", productsRoutes);
app.use("/v1/product_options", productOptionsRoutes);
app.use("/v1/product_categories", productCategoriesRoutes);
app.use("/v1/customers", customersRoutes);
app.use("/v1/orders", ordersRoutes);
app.use("/v1/inventory", inventoryRoutes);
app.use("/v1/shipments", shipmentsRoutes);
app.use("/api/admin", adminAvatarRoutes);

// Base health-check route
app.get("/", (req, res) => {
	res.success(null, "Free Carver API is running!");
});

// Global error handling middleware
app.use((err, req, res, next) => {
	req.log("error", `Server error: ${err.message}`, { error: err });
	res.error("Internal server error", 500);
});

export default app;
