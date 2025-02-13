// /api/routes/v1/adminAuth.js

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
 * @route   POST /v1/adminAuth/login
 * @desc    Authenticate an admin user and return a JWT token
 * @access  Public
 */
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate request body
		if (!email || !password) {
			logger.error(
				"Admin login failed: Email and password are required."
			);
			return res
				.status(400)
				.json({ error: "Email and password are required." });
		}

		// Query the admin_users table for the provided email
		const result = await pool.query(
			"SELECT * FROM admin_users WHERE email = $1",
			[email]
		);
		if (result.rows.length === 0) {
			logger.error(`Admin login failed: Email not found (${email}).`);
			return res.status(401).json({ error: "Invalid credentials." });
		}

		const admin = result.rows[0];

		// Compare the provided password with the stored password hash
		const isPasswordValid = await bcrypt.compare(
			password,
			admin.password_hash
		);
		if (!isPasswordValid) {
			logger.error(
				`Admin login failed: Invalid password for email (${email}).`
			);
			return res.status(401).json({ error: "Invalid credentials." });
		}

		// Create JWT payload and sign the token
		const tokenPayload = {
			id: admin.id,
			email: admin.email,
			role_id: admin.role_id,
		};

		const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		logger.info(`Admin logged in successfully: ${email}`);
		res.status(200).json({ token });
	} catch (error) {
		logger.error("Error during admin login", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @route   GET /v1/adminAuth/me
 * @desc    Retrieve the current authenticated admin's details
 * @access  Protected
 */
router.get("/me", verifyJWT, (req, res) => {
	// The verifyJWT middleware attaches the decoded token to req.admin
	logger.info(`Retrieving admin details for: ${req.admin.email}`);
	res.status(200).json({ admin: req.admin });
});

export default router;
