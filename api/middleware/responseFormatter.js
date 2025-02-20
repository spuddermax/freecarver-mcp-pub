// /api/middleware/responseFormatter.js
import { createLogger, format, transports } from "winston";

const logger = createLogger({
	format: format.combine(
		format.timestamp(),
		// This example prints both the message and the metadata (if any)
		format.printf(({ timestamp, level, message, ...meta }) => {
			const metaString = Object.keys(meta).length
				? JSON.stringify(meta)
				: "";
			return `${timestamp} [${level}] ${message} ${metaString}`;
		})
	),
	transports: [new transports.Console()],
});

const responseFormatter = (req, res, next) => {
	res.success = (
		data = {},
		message = "Request successful",
		statusCode = 200
	) => {
		const responseBody = {
			status: "success",
			message,
			data,
		};
		logger.info("Sending success response:", responseBody);
		return res.status(statusCode).json(responseBody);
	};

	res.error = (
		message = "Internal server error",
		errorCode = 500,
		error = null
	) => {
		const responseBody = {
			status: "fail",
			message,
			error,
		};
		logger.error("Sending error response:", responseBody);
		return res.status(errorCode).json(responseBody);
	};

	res.validationError = (
		error = {},
		message = "Validation failed",
		statusCode = 422
	) => {
		const responseBody = {
			status: "fail",
			message,
			error,
		};
		logger.error("Sending validation error response:", responseBody);
		return res.status(statusCode).json(responseBody);
	};

	next();
};

export { logger };
export default responseFormatter;
