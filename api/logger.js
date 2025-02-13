// /api/logger.js

import { createLogger, format, transports } from "winston";
const { combine, timestamp, json, prettyPrint } = format;

// Create the logger with a file transport
const logger = createLogger({
	level: "error", // log errors and above
	format: combine(timestamp(), json(), prettyPrint()),
	transports: [
		// Ensure that the file path /var/log/freecarver-api/ exists and has the right permissions
		new transports.File({
			filename: "/var/log/freecarver-api/error.log",
			level: "error",
		}),
	],
});

// Optionally add console logging in non-production environments
if (process.env.NODE_ENV !== "production") {
	logger.add(
		new transports.Console({
			format: format.simple(),
		})
	);
}

export default logger;
