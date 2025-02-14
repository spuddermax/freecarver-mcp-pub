// /api/routes/v1/system.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

/**
 * @route   GET /v1/system/preferences
 * @desc    Retrieve all system preferences
 * @access  Public
 */
router.get("/preferences", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM system_preferences ORDER BY key"
		);
		logger.info("Retrieved system preferences");
		res.success(
			{ preferences: result.rows },
			"System preferences retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving system preferences", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route   PUT /v1/system/preferences/:key
 * @desc    Update a system preference by key
 * @access  Protected (Admin)
 */
router.put("/preferences/:key", verifyJWT, async (req, res) => {
	const { key } = req.params;
	const { value } = req.body;

	if (value === undefined) {
		logger.error(
			"Update system preference failed: 'value' field is required."
		);
		return res.error("'value' field is required.", 400);
	}

	try {
		const result = await pool.query(
			"UPDATE system_preferences SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *",
			[value, key]
		);
		if (result.rows.length === 0) {
			logger.error(`System preference with key "${key}" not found.`);
			return res.error("System preference not found.", 404);
		}
		logger.info(
			`System preference with key "${key}" updated successfully.`
		);
		res.success(
			{ preference: result.rows[0] },
			"System preference updated successfully"
		);
	} catch (error) {
		logger.error("Error updating system preference", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route   GET /v1/system/audit-logs
 * @desc    Retrieve all audit logs (optionally, add filtering via query parameters)
 * @access  Protected (Admin)
 */
router.get("/audit_logs", verifyJWT, async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM audit_logs ORDER BY created_at DESC"
		);
		logger.info("Retrieved audit logs");
		res.success(
			{ audit_logs: result.rows },
			"Audit logs retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving audit logs", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route   GET /v1/system/database-status
 * @desc    Retrieve the status of the database
 * @access  Public
 */
router.get("/database_status", async (req, res) => {
	try {
		const result = await pool.query("SELECT NOW()");
		logger.info("Database status retrieved successfully");
		res.success(
			{ status: result.rows[0].now },
			"Database status retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving database status", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

export default router;
