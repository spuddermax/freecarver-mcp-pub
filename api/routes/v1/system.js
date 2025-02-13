// /api/routes/v1/system.js

import express from "express";
import { pool } from "../../db.js";
import logger from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Protect all routes in this file
router.use(verifyJWT);

/**
 * @route   GET /v1/system/preferences
 * @desc    Retrieve all system preferences
 * @access  Protected (Admin)
 */
router.get("/preferences", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM system_preferences ORDER BY key"
		);
		logger.info("Retrieved system preferences");
		res.status(200).json({ preferences: result.rows });
	} catch (error) {
		logger.error("Error retrieving system preferences", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @route   PUT /v1/system/preferences/:key
 * @desc    Update a system preference by key
 * @access  Protected (Admin)
 */
router.put("/preferences/:key", async (req, res) => {
	const { key } = req.params;
	const { value } = req.body;

	if (value === undefined) {
		logger.error(
			"Update system preference failed: 'value' field is required."
		);
		return res.status(400).json({ error: "'value' field is required." });
	}

	try {
		const result = await pool.query(
			"UPDATE system_preferences SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *",
			[value, key]
		);
		if (result.rows.length === 0) {
			logger.error(`System preference with key "${key}" not found.`);
			return res
				.status(404)
				.json({ error: "System preference not found." });
		}
		logger.info(
			`System preference with key "${key}" updated successfully.`
		);
		res.status(200).json({ preference: result.rows[0] });
	} catch (error) {
		logger.error("Error updating system preference", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @route   GET /v1/system/audit-logs
 * @desc    Retrieve all audit logs (optionally, add filtering via query parameters)
 * @access  Protected (Admin)
 */
router.get("/audit-logs", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM audit_logs ORDER BY created_at DESC"
		);
		logger.info("Retrieved audit logs");
		res.status(200).json({ audit_logs: result.rows });
	} catch (error) {
		logger.error("Error retrieving audit logs", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
