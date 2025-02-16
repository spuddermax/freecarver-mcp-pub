// /api/middleware/responseFormatter.js
const responseFormatter = (req, res, next) => {
	res.success = (
		data = {},
		message = "Request successful",
		statusCode = 200
	) => {
		return res.status(statusCode).json({
			status: "success",
			message,
			data,
		});
	};

	res.error = (
		message = "Something went wrong",
		errorCode = 500,
		errors = null
	) => {
		return res.status(errorCode).json({
			status: "error",
			message,
			error_code: errorCode,
			errors,
		});
	};

	res.validationError = (
		errors = {},
		message = "Validation failed",
		statusCode = 422
	) => {
		return res.status(statusCode).json({
			status: "fail",
			message,
			errors,
		});
	};

	next();
};

export default responseFormatter;
