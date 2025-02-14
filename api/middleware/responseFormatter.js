// /api/middleware/responseFormatter.js

const responseFormatter = (req, res, next) => {
	res.success = (data = {}, message = "Request completed successfully") => {
		res.status(200).json({
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
		res.status(errorCode).json({
			status: "error",
			message,
			error_code: errorCode,
			errors,
		});
	};

	res.validationError = (errors = {}, message = "Validation failed") => {
		res.status(422).json({
			status: "fail",
			message,
			errors,
		});
	};

	next();
};

export default responseFormatter;
