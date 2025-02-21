// /api/logger.js

import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import dotenv from "dotenv";

dotenv.config();

const { combine, timestamp, printf } = format;

// Custom log format for both console and file output
const structuredFormat = printf(
	({ level, message, timestamp, stack, ip, body }) => {
		let bodyStr = "";
		// If the body is defined and not empty, log the body
		if (body && Object.keys(body).length > 0) {
			bodyStr = ` | Request Body: ${JSON.stringify(body)}`;
			return `${timestamp} [${ip || "N/A"}] ${level}: ${
				stack || message
			}${bodyStr}`;
		} else {
			return `${timestamp} [${ip || "N/A"}] ${level}: ${
				stack || message
			}${bodyStr}`;
		}
	}
);

// This format enforces a structured JSON log entry.
const customFormat = printf(
	({ level, message, timestamp, ip, requestId, meta, stack }) => {
		const logEntry = {
			timestamp,
			ip: ip || "LOCALHOST",
			level,
			message: stack || message,
			// include the IP if available, or default to "N/A"
			// optional: include a requestId if present
			...(requestId && { requestId }),
			// any extra metadata
			...(meta && Object.keys(meta).length > 0 && { meta }),
		};
		return JSON.stringify(logEntry);
	}
);

// Define file paths with fallback defaults
const errorLogFile =
	process.env.ERROR_LOG_FILE || "/var/log/freecarver-api/error.log";
const infoLogFile =
	process.env.INFO_LOG_FILE || "/var/log/freecarver-api/info.log";

// Daily rotate transport configuration
const dailyRotateTransport = new DailyRotateFile({
	filename:
		process.env.LOG_FILE_PATH ||
		"/var/log/freecarver-api/application-%DATE%.log",
	datePattern: "YYYY-MM-DD",
	zippedArchive: true,
	maxSize: "20m",
	maxFiles: "14d",
});

// Create an array of transports with the same structured format for file logs
const loggerTransports = [
	new transports.File({
		filename: errorLogFile,
		level: "error",
		format: combine(timestamp(), customFormat),
	}),
	new transports.File({
		filename: infoLogFile,
		level: "info",
		format: combine(timestamp(), customFormat),
	}),
	// Add the daily rotating transport
	dailyRotateTransport,
];

if (process.env.NODE_ENV !== "production") {
	loggerTransports.push(
		new transports.Console({
			level: "debug",
			format: combine(timestamp(), customFormat),
		})
	);
}

// Create logger instance
const logger = createLogger({
	level: process.env.NODE_ENV !== "production" ? "debug" : "info",
	transports: loggerTransports,
	exitOnError: false,
});

function sanitizeData(data) {
	if (!data || typeof data !== "object") return data;
	const sanitized = { ...data };
	// Mask sensitive fields
	["password", "newPassword", "confirmPassword"].forEach((field) => {
		if (sanitized[field]) {
			sanitized[field] = "******";
		}
	});
	return sanitized;
}

// Middleware for attaching client IP and sanitized request body to logs
const logRequest = (req, res, next) => {
	req.log = (level, message, extraData = {}) => {
		const clientIp =
			req.headers["x-forwarded-for"] || req.connection.remoteAddress;
		logger.log({
			level,
			message,
			ip: clientIp,
			body: sanitizeData(req.body),
			...extraData,
		});
	};
	next();
};

export { logger }; // Correctly export as named export
export { logRequest }; // Ensure logRequest is exported properly
