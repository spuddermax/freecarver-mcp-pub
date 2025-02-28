// /api/server.js

import app from "./app.js";
import dotenv from "dotenv";
import { logger } from "./middleware/logger.js";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with explicit path to ensure it finds the .env file
const result = dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (result.error) {
	logger.warn(`Error loading .env file: ${result.error.message}`);

	// Fall back to standard dotenv loading
	dotenv.config();
}

// Verify critical environment variables are loaded
logger.info("Environment loaded. NODE_ENV: " + process.env.NODE_ENV);

// Log Cloudflare config presence (not the values for security)
logger.info(
	"Cloudflare config available: " +
		(process.env.CLOUDFLARE_ACCOUNT_ID ? "Yes" : "No") +
		", " +
		"R2 bucket: " +
		(process.env.CLOUDFLARE_R2_BUCKET_NAME || "Not configured")
);

const PORT = process.env.PORT || 3000;

// Use HTTPS when USE_HTTPS is set to "true" in your .env file.
// You can define API_SSL_KEY and API_SSL_CERT for the API's certificate and key paths.
if (process.env.USE_HTTPS === "true") {
	const keyPath =
		process.env.API_SSL_KEY || "/etc/ssl/certs/freecarver-api-key.pem";
	const certPath =
		process.env.API_SSL_CERT || "/etc/ssl/certs/freecarver-api-cert.crt";

	const httpsOptions = {
		key: fs.readFileSync(keyPath),
		cert: fs.readFileSync(certPath),
	};

	https.createServer(httpsOptions, app).listen(PORT, () => {
		logger.info(`HTTPS Server is running on port ${PORT}`);
	});
} else {
	app.listen(PORT, () => {
		logger.info(`HTTP Server is running on port ${PORT}`);
	});
}
