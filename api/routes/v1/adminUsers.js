// /api/routes/v1/adminUsers.js

import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../../db.js";
import logger from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Apply the JWT authentication middleware to all routes in this file
router.use(verifyJWT);

/**
 * @route   GET /v1/adminUsers
 * @desc    Retrieve a list of all admin users
 * @access  Protected
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT id, email, first_name, last_name, phone_number, avatar_url, timezone, role_id, mfa_enabled, mfa_method, created_at, updated_at FROM admin_users"
		);
		logger.info("Retrieved admin users list");
		res.status(200).json({ admins: result.rows });
	} catch (error) {
		logger.error("Error retrieving admin users", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @route   GET /v1/adminUsers/:id
 * @desc    Retrieve details for a single admin user by ID
 * @access  Protected
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT id, email, first_name, last_name, phone_number, avatar_url, timezone, role_id, mfa_enabled, mfa_method, created_at, updated_at FROM admin_users WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Admin user with ID ${id} not found.`);
			return res.status(404).json({ error: "Admin user not found." });
		}
		logger.info(`Retrieved admin user with ID ${id}`);
		res.status(200).json({ admin: result.rows[0] });
	} catch (error) {
		logger.error("Error retrieving admin user", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @route   POST /v1/adminUsers
 * @desc    Create a new admin user
 * @access  Protected
 */
router.post("/", async (req, res) => {
	try {
		const {
			email,
			password,
			first_name,
			last_name,
			phone_number,
			role_id,
			timezone,
			mfa_enabled,
			mfa_method,
		} = req.body;
		if (!email || !password) {
			logger.error(
				"Admin user creation failed: Email and password are required."
			);
			return res
				.status(400)
				.json({ error: "Email and password are required." });
		}

		// Check if the email is already in use
		const existing = await pool.query(
			"SELECT id FROM admin_users WHERE email = $1",
			[email]
		);
		if (existing.rows.length > 0) {
			logger.error(
				`Admin user creation failed: Email ${email} is already in use.`
			);
			return res.status(409).json({ error: "Email already in use." });
		}

		// Hash the password before storing it
		const password_hash = await bcrypt.hash(password, 10);

		const result = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, phone_number, role_id, timezone, mfa_enabled, mfa_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, first_name, last_name, phone_number, avatar_url, timezone, role_id, mfa_enabled, mfa_method, created_at, updated_at`,
			[
				email,
				password_hash,
				first_name,
				last_name,
				phone_number,
				role_id,
				timezone,
				mfa_enabled,
				mfa_method,
			]
		);
		logger.info(`Admin user created successfully: ${email}`);
		res.status(201).json({ admin: result.rows[0] });
	} catch (error) {
		logger.error("Error creating admin user", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @route   PUT /v1/adminUsers/:id
 * @desc    Update an existing admin user's details
 * @access  Protected
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const {
			email,
			first_name,
			last_name,
			phone_number,
			timezone,
			mfa_enabled,
			mfa_method,
		} = req.body;

		// Optional: Add validation for required fields if needed

		const result = await pool.query(
			`UPDATE admin_users
       SET email = $1,
           first_name = $2,
           last_name = $3,
           phone_number = $4,
           timezone = $5,
           mfa_enabled = $6,
           mfa_method = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, email, first_name, last_name, phone_number, avatar_url, timezone, role_id, mfa_enabled, mfa_method, created_at, updated_at`,
			[
				email,
				first_name,
				last_name,
				phone_number,
				timezone,
				mfa_enabled,
				mfa_method,
				id,
			]
		);

		if (result.rows.length === 0) {
			logger.error(`Admin user with ID ${id} not found for update.`);
			return res.status(404).json({ error: "Admin user not found." });
		}

		logger.info(`Admin user with ID ${id} updated successfully.`);
		res.status(200).json({ admin: result.rows[0] });
	} catch (error) {
		logger.error("Error updating admin user", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @route   DELETE /v1/adminUsers/:id
 * @desc    Delete an admin user by ID
 * @access  Protected
 */
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"DELETE FROM admin_users WHERE id = $1 RETURNING id",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Admin user with ID ${id} not found for deletion.`);
			return res.status(404).json({ error: "Admin user not found." });
		}
		logger.info(`Admin user with ID ${id} deleted successfully.`);
		res.status(200).json({ message: "Admin user deleted successfully." });
	} catch (error) {
		logger.error("Error deleting admin user", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * (Optional) @route POST /v1/adminUsers/:id/avatar
 * @desc    Upload or update an admin user's avatar
 * @access  Protected
 *
 * Note: For file uploads, you might use middleware such as multer.
 */
// router.post("/:id/avatar", upload.single('avatar'), async (req, res) => {
//   // Implement file handling and update admin_users.avatar_url accordingly
// });

export default router;
