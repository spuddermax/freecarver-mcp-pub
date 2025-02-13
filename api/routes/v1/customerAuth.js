// /api/routes/v1/customerAuth.js

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../../db.js";
import logger from "../../logger.js";
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

		// Validate request body
		if (!email || !password) {
			logger.error(
				"Customer login failed: Email and password are required."
			);
			return res
				.status(400)
				.json({ error: "Email and password are required." });
		}

		// Query the customers table for the provided email
		const result = await pool.query(
			"SELECT * FROM customers WHERE email = $1",
			[email]
		);
		if (result.rows.length === 0) {
			logger.error(`Customer login failed: Email not found (${email}).`);
			return res.status(401).json({ error: "Invalid credentials." });
		}

		const customer = result.rows[0];

		// Compare the provided password with the stored password hash
		const isPasswordValid = await bcrypt.compare(
			password,
			customer.password_hash
		);
		if (!isPasswordValid) {
			logger.error(
				`Customer login failed: Invalid password for email (${email}).`
			);
			return res.status(401).json({ error: "Invalid credentials." });
		}

		// Create JWT payload and sign the token
		const tokenPayload = {
			id: customer.id,
			email: customer.email,
		};

		const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		logger.info(`Customer logged in successfully: ${email}`);
		res.status(200).json({ token });
	} catch (error) {
		logger.error("Error during customer login", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @route   GET /v1/customerAuth/me
 * @desc    Retrieve the current authenticated customer's details
 * @access  Protected
 */
router.get("/me", verifyJWT, (req, res) => {
	// The verifyJWT middleware attaches the decoded token to req.admin.
	// In this customerAuth route, we treat it as the customer's payload.
	logger.info(`Retrieving customer details for: ${req.admin.email}`);
	res.status(200).json({ customer: req.admin });
});

export default router;
