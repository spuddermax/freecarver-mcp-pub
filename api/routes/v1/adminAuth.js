import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../../db.js";
import { verifyJWT } from "../../middleware/auth.js";
import { logger } from "../../logger.js";

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
			req.log(
				"error",
				"Admin login failed: Email and password are required."
			);
			return res.validationError({
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
			adminFirstName: admin.first_name,
			adminLastName: admin.last_name,
			adminRoleName: admin.role_name,
			adminAvatarUrl: admin.avatar_url,
		};
		const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		req.log("info", `Admin logged in successfully: ${email}`);
		res.success({ token }, "Login successful");
	} catch (error) {
		req.log("error", "Error during admin login", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route   GET /v1/adminAuth/me
 * @desc    Retrieve the current authenticated admin's details
 * @access  Protected
 */
router.get("/me", verifyJWT, (req, res) => {
	try {
		req.log("info", `Retrieving admin details for: ${req.admin.email}`);
		res.success({ admin: req.admin }, "Admin details retrieved");
	} catch (error) {
		req.log("error", "Error retrieving admin details", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route   POST /v1/adminAuth/logout
 * @desc    Logs out an admin (Token handling on frontend)
 * @access  Protected
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
