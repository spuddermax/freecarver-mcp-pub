// /api/middleware/validateRequest.js

import Joi from "joi";
import { logger } from "./logger.js";

/**
 * validateRequest is a higher-order middleware that validates a property
 * (e.g., body, query, or params) against a JOI schema.
 *
 * @param {Joi.ObjectSchema} schema - The JOI schema to validate the request property.
 * @param {string} property - The request property to validate (defaults to "body").
 * @param {string} customErrorMessage - The custom error message to use if validation fails (defaults to "Validation failed").
 */
const validateRequest = (
	schema,
	property = "body",
	customErrorMessage = "Validation failed"
) => {
	return (req, res, next) => {
		const { error } = schema.validate(req[property], {
			abortEarly: false,
			allowUnknown: true, // allow additional fields if necessary
		});

		if (error) {
			// Format each Joi error message and join them into one string.
			const errorMessages = error.details
				.map((detail) => detail.message)
				.join(", ");
			// Log the detailed validation error.
			logger.error(`Validation error: ${errorMessages}`, {
				details: error.details,
			});
			// Return the formatted error(s) in the response.
			return res.validationError(
				error.details.map((detail) => ({
					field: detail.path.join("."),
					message: detail.message,
				})),
				customErrorMessage
			);
		}
		next();
	};
};

export default validateRequest;
