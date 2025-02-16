import Joi from "joi";

/**
 * validateRequest is a higher-order middleware that validates a property
 * (e.g., body, query, or params) against a JOI schema.
 *
 * @param {Joi.ObjectSchema} schema - The JOI schema to validate the request property.
 * @param {string} property - The request property to validate (defaults to "body").
 */
const validateRequest = (schema, property = "body") => {
	return (req, res, next) => {
		const { error } = schema.validate(req[property], {
			abortEarly: false,
			allowUnknown: true, // allow additional fields if necessary
		});
		if (error) {
			// Use the response formatter middleware if available
			return res.validationError(
				error.details.map((d) => ({
					field: d.path.join("."),
					message: d.message,
				})),
				"Validation failed"
			);
		}
		next();
	};
};

export default validateRequest;
