// /api/routes/v1/adminUsers.js

import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../../db.js";
import { logger } from "../../middleware/logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import validateRequest from "../../middleware/validateRequest.js";
import {
	createAdminUserSchema,
	updateAdminUserSchema,
	adminUserIdSchema,
} from "../../validators/adminUsers.js";

const router = express.Router();

// Apply the JWT authentication middleware to all routes in this file
router.use(verifyJWT);

/**
 * @route GET /v1/adminUsers
 * @description Retrieve a list of all admin users.
 * @access Protected
 * @returns {Response} 200 - Returns a JSON object containing an array of admin users.
 * @returns {Response} 500 - Returns an error message for internal server error.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT au.id, au.email, au.first_name, au.last_name, au.phone_number, au.avatar_url, au.timezone, ar.role_name, au.mfa_enabled, au.mfa_method, au.created_at, au.updated_at FROM admin_users au JOIN admin_roles ar ON au.role_id = ar.id;"
		);
		logger.info("Retrieved admin users list");
		res.success(
			{ admins: result.rows },
			"Admin users retrieved successfully",
			200
		);
	} catch (error) {
		logger.error("Error retrieving admin users", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/adminUsers/:id
 * @description Retrieve details for a single admin user by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the admin user.
 * @returns {Response} 200 - Returns a JSON object containing the admin user details.
 * @returns {Response} 404 - Returns an error message if the admin user is not found.
 * @returns {Response} 500 - Returns an error message for internal server error.
 */
router.get(
	"/:id",
	validateRequest(adminUserIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"SELECT id, email, first_name, last_name, phone_number, avatar_url, timezone, role_id, mfa_enabled, mfa_method, created_at, updated_at FROM admin_users WHERE id = $1",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Admin user with ID ${id} not found.`);
				return res.error("Admin user not found.", 404);
			}
			logger.info(`Retrieved admin user with ID ${id}`);
			res.success(
				{ admin: result.rows[0] },
				"Admin user retrieved successfully",
				200
			);
		} catch (error) {
			logger.error("Error retrieving admin user", {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route POST /v1/adminUsers
 * @description Create a new admin user.
 * @access Protected
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The admin user's email (required).
 * @param {string} req.body.password - The admin user's password (required).
 * @param {string} req.body.first_name - The admin user's first name.
 * @param {string} req.body.last_name - The admin user's last name.
 * @param {string} req.body.phone_number - The admin user's phone number.
 * @param {number} req.body.role_id - The admin user's role ID.
 * @param {string} req.body.timezone - The admin user's timezone.
 * @param {boolean} req.body.mfa_enabled - Whether multi-factor authentication is enabled.
 * @param {string} req.body.mfa_method - The multi-factor authentication method.
 * @returns {Response} 201 - Returns a JSON object containing the newly created admin user.
 * @returns {Response} 400 - Returns validation error if email or password is missing.
 * @returns {Response} 409 - Returns an error if the email is already in use.
 * @returns {Response} 500 - Returns an error message for internal server error.
 */
router.post(
	"/",
	validateRequest(createAdminUserSchema, "body"),
	async (req, res) => {
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
			// Email and password are now validated by the middleware.

			// Check if the email is already in use
			const existing = await pool.query(
				"SELECT id FROM admin_users WHERE email = $1",
				[email]
			);
			if (existing.rows.length > 0) {
				logger.error(
					`Admin user creation failed: Email ${email} is already in use.`
				);
				return res.error("Email already in use.", 409);
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

			res.success(
				{ admin: result.rows[0] },
				"Admin user created successfully",
				201
			);
		} catch (error) {
			logger.error("Error creating admin user", { error: error.message });
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route PUT /v1/adminUsers/:id
 * @description Update an existing admin user's details.
 * @access Protected
 * @param {string} req.params.id - The ID of the admin user to update.
 * @param {Object} req.body - The updated admin user details.
 * @param {string} [req.body.email] - The updated email.
 * @param {string} [req.body.first_name] - The updated first name.
 * @param {string} [req.body.last_name] - The updated last name.
 * @param {string} [req.body.phone_number] - The updated phone number.
 * @param {string} [req.body.timezone] - The updated timezone.
 * @param {boolean} [req.body.mfa_enabled] - The updated MFA enabled status.
 * @param {string} [req.body.mfa_method] - The updated MFA method.
 * @param {string} [req.body.password] - The updated password.
 * @returns {Response} 200 - Returns a JSON object containing the updated admin user.
 * @returns {Response} 400 - Returns an error if no valid fields are provided or if ID is missing.
 * @returns {Response} 404 - Returns an error if the admin user is not found.
 * @returns {Response} 500 - Returns an error message for internal server error.
 */
router.put(
	"/:id",
	validateRequest(adminUserIdSchema, "params"),
	validateRequest(updateAdminUserSchema, "body"),
	async (req, res) => {
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
				password,
			} = req.body;

			// Build an object with only the fields provided
			const updateFields = {};
			if (email) updateFields.email = email;
			if (first_name) updateFields.first_name = first_name;
			if (last_name) updateFields.last_name = last_name;
			if (phone_number) updateFields.phone_number = phone_number;
			if (timezone) updateFields.timezone = timezone;
			if (mfa_enabled !== undefined)
				updateFields.mfa_enabled = mfa_enabled;
			if (mfa_method) updateFields.mfa_method = mfa_method;
			if (password)
				updateFields.password_hash = await bcrypt.hash(password, 10);

			// If no valid fields are provided, return an error.
			const keys = Object.keys(updateFields);
			if (keys.length === 0) {
				logger.error("No valid fields to update for admin user", {
					id,
				});
				return res.validationError(
					{ error: "No valid fields to update." },
					"No valid fields to update."
				);
			}

			// Build dynamic SET clause and values array
			const setClause = keys
				.map((field, index) => `${field} = $${index + 1}`)
				.join(", ");
			const values = keys.map((key) => updateFields[key]);
			// Append the user id as the last parameter
			values.push(id);

			// Include updated_at in the query
			const queryText = `
      UPDATE admin_users
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id, email, first_name, last_name, phone_number, avatar_url, timezone, role_id, mfa_enabled, mfa_method, created_at, updated_at
    `;

			const result = await pool.query(queryText, values);

			if (result.rows.length === 0) {
				logger.error(`Admin user with ID ${id} not found for update.`);
				return res.error("Admin user not found.", 404);
			}

			logger.info(`Admin user with ID ${id} updated successfully.`);
			res.success(
				{ admin: result.rows[0] },
				"Admin user updated successfully",
				200
			);
		} catch (error) {
			logger.error("Error updating admin user", { error: error.message });
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route DELETE /v1/adminUsers/:id
 * @description Delete an admin user by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the admin user to delete.
 * @returns {Response} 200 - Returns a JSON object indicating successful deletion.
 * @returns {Response} 404 - Returns an error if the admin user is not found.
 * @returns {Response} 500 - Returns an error message for internal server error.
 */
router.delete(
	"/:id",
	validateRequest(adminUserIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"DELETE FROM admin_users WHERE id = $1 RETURNING id",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(
					`Admin user with ID ${id} not found for deletion.`
				);
				return res.error("Admin user not found.", 404);
			}
			logger.info(`Admin user with ID ${id} deleted successfully.`);
			res.success(null, "Admin user deleted successfully", 200);
		} catch (error) {
			logger.error("Error deleting admin user", { error: error.message });
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route POST /v1/adminUsers/:id/validatePassword
 * @description Validate an admin user's password.
 * @access Protected
 * @param {string} req.params.id - The ID of the admin user whose password will be validated.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.password - The password to validate.
 * @returns {Response} 200 - Returns a JSON object indicating whether the password is valid.
 * @returns {Response} 500 - Returns an error message for internal server error.
 */
router.post("/:id/validatePassword", async (req, res) => {
	try {
		const { id } = req.params;
		const { password } = req.body;

		const result = await pool.query(
			"SELECT password_hash FROM admin_users WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			return res.error("Invalid user.", 401);
		}
		const isPasswordValid = await bcrypt.compare(
			password,
			result.rows[0].password_hash
		);
		if (!isPasswordValid) {
			logger.error(
				`Admin user with ID ${id} validation failed: Invalid password.`
			);
			return res.error("Invalid password.", 401);
		}
		logger.info(`Admin user with ID ${id} validated successfully.`);
		res.success(
			{ result: true, message: "Valid password." },
			"Valid password.",
			200
		);
	} catch (error) {
		logger.error("Error validating admin user password", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

export default router;
