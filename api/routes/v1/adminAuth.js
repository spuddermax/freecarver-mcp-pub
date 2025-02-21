// /api/routes/v1/adminAuth.js

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../../db.js";
import { verifyJWT } from "../../middleware/auth.js";

dotenv.config();

const router = express.Router();

/**
 * @route POST /v1/adminAuth/login
 * @description Authenticate an admin user and return a JWT token.
 * @access Public
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The admin's email address.
 * @param {string} req.body.password - The admin's password.
 * @returns {Response} 200 - Returns a JSON object with the JWT token on successful login.
 * @returns {Response} 400 - Returns a validation error if email or password is missing.
 * @returns {Response} 401 - Returns an error if credentials are invalid.
 * @returns {Response} 500 - Returns an error for an internal server error.
 */
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		// Validate request body
		if (!email || !password) {
			req.log(
				"error",
				"Admin login failed: Email and password are required."
			);
			return res.error("Email and password are required.", 400, {
				email: "Email is required",
				password: "Password is required",
			});
		}

		// Query the admin_users table for the provided email
		const result = await pool.query(
			"SELECT au.*, ar.role_name FROM admin_users au JOIN admin_roles ar ON au.role_id = ar.id WHERE au.email = $1",
			[email]
		);

		if (result.rows.length === 0) {
			req.log("error", `Admin login failed: Email not found (${email}).`);
			return res.error("Invalid credentials.", 401);
		}

		const admin = result.rows[0];

		// Compare the provided password with the stored password hash
		const isPasswordValid = await bcrypt.compare(
			password,
			admin.password_hash
		);
		if (!isPasswordValid) {
			req.log(
				"error",
				`Admin login failed: Invalid password for email (${email}).`
			);
			return res.error("Invalid credentials.", 401);
		}

		// Create JWT token
		const tokenPayload = {
			adminId: admin.id,
			adminEmail: admin.email,
			adminFirstName: admin.first_name,
			adminLastName: admin.last_name,
			adminRoleName: admin.role_name,
			adminAvatarUrl: admin.avatar_url,
		};
		const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		req.log("info", `Admin logged in successfully: ${email}`);
		res.success({ token }, "Login successful");
	} catch (error) {
		req.log("error", "Error during admin login", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/adminAuth/me
 * @description Retrieve the current authenticated admin's details.
 * @access Protected
 * @param {Object} req - The Express request object. Assumes that verifyJWT middleware attaches the decoded admin payload to req.admin.
 * @returns {Response} 200 - Returns a JSON object with the admin's details.
 * @returns {Response} 500 - Returns an error for an internal server error.
 */
router.get("/me", verifyJWT, (req, res) => {
	// If the verifyJWT middleware didn't attach the decoded payload,
	// decode the token manually from the Authorization header.
	let admin = req.admin;
	if (!admin) {
		const authHeader = req.headers.authorization;
		if (authHeader) {
			const token = authHeader.split(" ")[1];
			admin = jwt.decode(token);
		}
	}

	if (!admin) {
		// If still not available, return an unauthorized error.
		return res.error("Unauthorized", 401);
	}

	req.log("info", `Retrieving admin details for: ${admin.adminEmail}`);
	res.success({ admin }, "Admin details retrieved");
});

/**
 * @route POST /v1/adminAuth/logout
 * @description Logs out an admin user. (Token handling is assumed to be managed on the frontend.)
 * @access Protected
 * @param {Object} req - The Express request object. Assumes that verifyJWT middleware attaches the decoded admin payload to req.admin.
 * @returns {Response} 200 - Returns a success message upon logout.
 * @returns {Response} 500 - Returns an error for an internal server error.
 */
router.post("/logout", verifyJWT, (req, res) => {
	try {
		req.log("info", `Admin logged out: ${req.admin.email}`);
		res.success(null, "Logout successful");
	} catch (error) {
		req.log("error", "Error during admin logout", { error: error.message });
		res.error("Internal server error", 500);
	}
});

export default router;
