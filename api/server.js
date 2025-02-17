// /api/server.js

import app from "./app.js";
import dotenv from "dotenv";
import { logger } from "./logger.js";
import fs from "fs";
import https from "https";

dotenv.config();

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
