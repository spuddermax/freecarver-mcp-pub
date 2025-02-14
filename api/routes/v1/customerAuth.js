// /api/routes/v1/customerAuth.js

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

dotenv.config();

const router = express.Router();

/**
 * @route   POST /v1/customerAuth/login
 * @desc    Authenticate a customer and return a JWT token
 * @access  Public
 */
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			logger.error(
				"Customer login failed: Email and password are required."
			);
			return res.validationError(
				{
					email: "Email is required",
					password: "Password is required",
				},
				"Email and password are required."
			);
		}
		const result = await pool.query(
			"SELECT * FROM customers WHERE email = $1",
			[email]
		);
		if (result.rows.length === 0) {
			logger.error(`Customer login failed: Email not found (${email}).`);
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
		logger.error("Error during customer login", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route   GET /v1/customerAuth/me
 * @desc    Retrieve the current authenticated customer's details
 * @access  Protected
 */
router.get("/me", verifyJWT, (req, res) => {
	logger.info(`Retrieving customer details for: ${req.admin.email}`);
	res.success({ customer: req.admin }, "Customer details retrieved");
});

export default router;
