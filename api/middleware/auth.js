// /api/middleware/auth.js

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../logger.js";

dotenv.config();

// Ensure the JWT_SECRET environment variable is set
if (!process.env.JWT_SECRET) {
	logger.error("JWT_SECRET is not defined in the environment variables.");
	process.exit(1);
}

/**
 * Middleware to verify the JWT token.
 * This function checks for the Authorization header, verifies the token,
 * and attaches the decoded token (admin details) to the request object.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
function verifyJWT(req, res, next) {
	const authHeader = req.headers["authorization"];
	if (!authHeader) {
		logger.error("No authorization header provided.");
		return res.status(401).json({ error: "No token provided" });
	}

	// Expect header format: "Bearer <token>"
	const token = authHeader.split(" ")[1];
	if (!token) {
		logger.error("Authorization header is missing the token part.");
		return res.status(401).json({ error: "Token missing" });
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) {
			logger.error("JWT verification failed.", { error: err.message });
			return res.status(401).json({ error: "Invalid token" });
		}
		// Attach the decoded token (admin details) to the request object
		req.admin = decoded;
		next();
	});
}

export { verifyJWT };
