import { createLogger, format, transports } from "winston";
import dotenv from "dotenv";

dotenv.config();

const { combine, timestamp, printf, colorize, json, prettyPrint } = format;

// Custom log format for console output
const customFormat = printf(({ level, message, timestamp, stack }) => {
	return `${timestamp} ${level}: ${stack || message}`;
});

// Define file paths with fallback defaults
const errorLogFile =
	process.env.ERROR_LOG_FILE || "/var/log/freecarver-api/error.log";
const infoLogFile =
	process.env.INFO_LOG_FILE || "/var/log/freecarver-api/info.log";

// Create an array of transports based on environment
const loggerTransports = [
	// Always log errors to file
	new transports.File({
		filename: errorLogFile,
		level: "error",
		format: combine(timestamp(), json()),
	}),
	// Always log info and above to a separate file
	new transports.File({
		filename: infoLogFile,
		level: "info",
		format: combine(timestamp(), json()),
	}),
];

// In non-production environments, add a console transport with colorized output
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

const logger = createLogger({
	level: process.env.NODE_ENV !== "production" ? "debug" : "info",
	transports: loggerTransports,
	exitOnError: false, // Do not exit on handled exceptions
});

export default logger;
