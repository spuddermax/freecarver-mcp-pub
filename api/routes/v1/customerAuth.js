// /api/routes/v1/customerAuth.js

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../../db.js";
import { logger } from "../../middleware/logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { customerAuthLoginSchema } from "../../validators/customerAuth.js";

dotenv.config();

const router = express.Router();

/**
 * @route POST /v1/customerAuth/login
 * @description Authenticate a customer and return a JWT token.
 * @access Public
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The customer's email address.
 * @param {string} req.body.password - The customer's password.
 * @returns {Response} 200 - Returns a JSON object containing the JWT token.
 * @returns {Response} 422 - Returns a validation error if email or password is missing/invalid.
 * @returns {Response} 401 - Returns an error if credentials are invalid.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.post(
	"/login",
	validateRequest(
		customerAuthLoginSchema,
		"body",
		"Email and password are required."
	),
	async (req, res) => {
		try {
			const { email, password } = req.body;
			const result = await pool.query(
				"SELECT * FROM customers WHERE email = $1",
				[email]
			);
			if (result.rows.length === 0) {
				logger.error(
					`Customer login failed: Email not found (${email}).`
				);
				return res.error("Invalid credentials.", 401);
			}
			const customer = result.rows[0];
			const isPasswordValid = await bcrypt.compare(
				password,
				customer.password_hash
			);
			if (!isPasswordValid) {
				logger.error(
					`Customer login failed: Invalid password for email (${email}).`
				);
				return res.error("Invalid credentials.", 401);
			}
			const tokenPayload = { id: customer.id, email: customer.email };
			const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
				expiresIn: "1h",
			});
			logger.info(`Customer logged in successfully: ${email}`);
			res.success({ token }, "Login successful");
		} catch (error) {
			logger.error("Error during customer login", {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/customerAuth/me
 * @description Retrieve the current authenticated customer's details.
 * @access Protected
 * @param {Object} req - The Express request object (expects req.admin to be set by verifyJWT middleware).
 * @returns {Response} 200 - Returns a JSON object containing the customer's details.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.get("/me", verifyJWT, (req, res) => {
	if (!req.admin) {
		logger.error("No token provided");
		return res.error("No token provided", 401);
	}
	try {
		logger.info(`Retrieving customer details for: ${req.admin.email}`);
		res.success({ customer: req.admin }, "Customer details retrieved");
	} catch (error) {
		logger.error("Error during customer details retrieval", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

export default router;
