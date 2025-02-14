import { createLogger, format, transports } from "winston";
import dotenv from "dotenv";

dotenv.config();

const { combine, timestamp, printf, colorize, json, prettyPrint } = format;

// Custom log format for console output
const customFormat = printf(({ level, message, timestamp, stack, ip }) => {
	return `${timestamp} [${ip || "N/A"}] ${level}: ${stack || message}`;
});

// Define file paths with fallback defaults
const errorLogFile =
	process.env.ERROR_LOG_FILE || "/var/log/freecarver-api/error.log";
const infoLogFile =
	process.env.INFO_LOG_FILE || "/var/log/freecarver-api/info.log";

// Create an array of transports based on environment
const loggerTransports = [
	new transports.File({
		filename: errorLogFile,
		level: "error",
		format: combine(timestamp(), json()),
	}),
	new transports.File({
		filename: infoLogFile,
		level: "info",
		format: combine(timestamp(), json()),
	}),
];

if (process.env.NODE_ENV !== "production") {
	loggerTransports.push(
		new transports.Console({
			level: "debug",
			format: combine(
				colorize(),
				timestamp(),
				prettyPrint(),
				customFormat
			),
		})
	);
}

// Create logger instance
const logger = createLogger({
	level: process.env.NODE_ENV !== "production" ? "debug" : "info",
	transports: loggerTransports,
	exitOnError: false,
});

// Middleware for attaching client IP to logs
const logRequest = (req, res, next) => {
	req.log = (level, message, extraData = {}) => {
		const clientIp =
			req.headers["x-forwarded-for"] || req.connection.remoteAddress;
		logger.log({
			level,
			message,
			ip: clientIp,
			...extraData,
		});
	};
	next();
};

export { logger }; // Correctly export as named export
export { logRequest }; // Ensure logRequest is exported properly
