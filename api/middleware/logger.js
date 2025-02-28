// /api/middleware/logger.js

import winston from "winston";
import express from "express";

// Regular JavaScript object to replace the TypeScript interface
// Uses JSDoc for type documentation
/**
 * @typedef {Object} LogInfo
 * @property {string} [ip]
 * @property {Object} [req]
 * @property {Object} [res]
 */

/**
 * Custom log format
 * @param {Object} info - Log information object
 */
const logFormat = winston.format.printf((info) => {
	const ip = info.ip || "-";
	const user = "-";
	const method = info.req?.method || "-";
	const url = info.req?.url || "-";
	const status = info.res?.statusCode || "-";
	const agent = info.req?.headers?.["user-agent"] || "-";

	// Process message to interpret escape sequences
	let message = info.message;
	if (typeof message === "string") {
		// Convert literal \n and \t to actual newlines and tabs
		message = message.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
	}
	info.message = message;

	// Process fields in objects that might contain formatted SQL
	if (info.query) {
		info.query =
			typeof info.query === "string"
				? info.query.replace(/\\n/g, "\n").replace(/\\t/g, "\t")
				: info.query;
	}

	if (info.formatted_query) {
		info.formatted_query =
			typeof info.formatted_query === "string"
				? info.formatted_query
						.replace(/\\n/g, "\n")
						.replace(/\\t/g, "\t")
				: info.formatted_query;
	}

	// Use custom stringify function if provided
	const json = info._toStringify
		? info._toStringify(info)
		: JSON.stringify(info, (key, value) => {
				// If this is a string with newlines or tabs, ensure they're preserved
				if (typeof value === "string") {
					// Convert literal \n and \t to actual newlines and tabs
					return value.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
				}
				return value;
		  });

	delete info._toStringify; // Remove the helper property

	return `${ip} ${user} [${info.timestamp}] "${method} ${url}" ${status} - "${agent}" ${json}`;
});

export const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	format: winston.format.combine(
		winston.format.timestamp({ format: "DD/MMM/YYYY:HH:mm:ss Z" }),
		logFormat
	),
	transports: [
		new winston.transports.File({
			filename: "/var/log/freecarver-api/info.log",
			level: "info",
		}),
		new winston.transports.File({
			filename: "/var/log/freecarver-api/error.log",
			level: "error",
		}),
		new winston.transports.File({
			filename: "/var/log/freecarver-api/debug.log",
			level: "debug",
		}),
		new winston.transports.Console({ level: "debug" }),
	],
});

/**
 * Enhanced error logger that includes detailed error information
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or details
 * @param {Object} [additionalInfo] - Any additional contextual information
 */
export function logError(message, error, additionalInfo = {}) {
	// Extract the error stack and message if it's an Error object
	const errorDetails =
		error instanceof Error
			? {
					message: error.message,
					stack: error.stack,
					name: error.name,
					...(error.code && { code: error.code }),
					...(error.details && { details: error.details }),
			  }
			: error;

	// Log the full error with a structured format that's easily readable
	logger.error(message, {
		error: errorDetails,
		...additionalInfo,
		// Add timestamp in a readable format
		timestamp: new Date().toISOString(),
	});

	// Also log to console during development for immediate visibility
	if (process.env.NODE_ENV !== "production") {
		console.error(message, errorDetails);
	}
}

/**
 * Log each request and response
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 * @param {Function} next - Next middleware
 * @returns {void}
 */
export function logRequest(req, res, next) {
	const start = Date.now();

	// Add log method to the request object to be used throughout the application
	req.log = function (level, message, metadata = {}) {
		logger[level](message, {
			ip: req.ip,
			...metadata,
			req: {
				method: req.method,
				url: req.url,
				headers: req.headers,
			},
		});
	};

	// Capture original response methods
	const originalSend = res.send;
	const originalJson = res.json;
	let responseBody;

	// Override res.send to capture response body
	res.send = function (body) {
		responseBody = body;
		return originalSend.apply(res, arguments);
	};

	// Override res.json to capture response body
	res.json = function (body) {
		responseBody = body;
		return originalJson.apply(res, arguments);
	};

	// Log request body immediately
	logger.info("API request received", {
		ip: req.ip,
		req: {
			method: req.method,
			url: req.url,
			headers: req.headers,
			body: req.body,
			params: req.params,
			query: req.query,
		},
	});

	res.on("finish", () => {
		const duration = Date.now() - start;

		// Parse response body if it's a string that looks like JSON
		let parsedResponseBody;
		if (typeof responseBody === "string") {
			try {
				if (
					responseBody.startsWith("{") ||
					responseBody.startsWith("[")
				) {
					parsedResponseBody = JSON.parse(responseBody);
				} else {
					parsedResponseBody = responseBody;
				}
			} catch (e) {
				parsedResponseBody = responseBody;
			}
		} else {
			parsedResponseBody = responseBody;
		}

		const logData = {
			ip: req.ip,
			req: {
				method: req.method,
				url: req.url,
				headers: req.headers,
				body: req.body,
			},
			res: {
				status: res.statusCode,
				headers: res.getHeaders(),
				body: parsedResponseBody || res.locals.body,
			},
			duration,
		};

		if (res.statusCode >= 400) {
			// Log as error for any status code >= 400
			logger.error(
				`API request failed with status ${res.statusCode}`,
				logData
			);
		} else {
			// Log as info for successful responses
			logger.info("API request completed", logData);
		}
	});

	next();
}
