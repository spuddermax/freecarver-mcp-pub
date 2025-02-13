// /api/routes/v1/customers.js

import express from "express";
import { pool } from "../../db.js";
import logger from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Apply JWT authentication to all routes in this file.
router.use(verifyJWT);

/**
 * GET /v1/customers
 * Retrieve a list of all customers.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT id, email, first_name, last_name, phone_number, created_at, updated_at FROM customers ORDER BY id"
		);
		logger.info("Retrieved customers list.");
		res.status(200).json({ customers: result.rows });
	} catch (error) {
		logger.error("Error retrieving customers list.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/customers
 * Create a new customer.
 * Required fields: email, password.
 * Optional: first_name, last_name, phone_number.
 * Note: This endpoint may be used by an admin to add customers manually.
 */
router.post("/", async (req, res) => {
	try {
		const { email, password, first_name, last_name, phone_number } =
			req.body;
		if (!email || !password) {
			logger.error(
				"Customer creation failed: Email and password are required."
			);
			return res
				.status(400)
				.json({ error: "Email and password are required." });
		}

		// Check if a customer with the given email already exists.
		const exists = await pool.query(
			"SELECT id FROM customers WHERE email = $1",
			[email]
		);
		if (exists.rows.length > 0) {
			logger.error(
				`Customer creation failed: Email ${email} is already in use.`
			);
			return res.status(409).json({ error: "Email already in use." });
		}

		// Hash the password.
		const hashedPassword = await bcrypt.hash(password, 10);
		const query = `
      INSERT INTO customers (email, password_hash, first_name, last_name, phone_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, phone_number, created_at, updated_at
    `;
		const result = await pool.query(query, [
			email,
			hashedPassword,
			first_name,
			last_name,
			phone_number,
		]);
		logger.info(`Customer created successfully: ${email}`);
		res.status(201).json({ customer: result.rows[0] });
	} catch (error) {
		logger.error("Error creating customer.", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/customers/:id
 * Retrieve details for a specific customer by ID.
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT id, email, first_name, last_name, phone_number, created_at, updated_at FROM customers WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Customer with ID ${id} not found.`);
			return res.status(404).json({ error: "Customer not found." });
		}
		logger.info(`Retrieved customer with ID ${id}.`);
		res.status(200).json({ customer: result.rows[0] });
	} catch (error) {
		logger.error(`Error retrieving customer with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/customers/:id
 * Update an existing customer's details.
 * Accepts: email, first_name, last_name, phone_number.
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { email, first_name, last_name, phone_number } = req.body;
		if (!email) {
			logger.error("Customer update failed: Email is required.");
			return res.status(400).json({ error: "Email is required." });
		}
		const query = `
      UPDATE customers
      SET email = $1,
          first_name = $2,
          last_name = $3,
          phone_number = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING id, email, first_name, last_name, phone_number, created_at, updated_at
    `;
		const result = await pool.query(query, [
			email,
			first_name,
			last_name,
			phone_number,
			id,
		]);
		if (result.rows.length === 0) {
			logger.error(`Customer with ID ${id} not found for update.`);
			return res.status(404).json({ error: "Customer not found." });
		}
		logger.info(`Customer with ID ${id} updated successfully.`);
		res.status(200).json({ customer: result.rows[0] });
	} catch (error) {
		logger.error(`Error updating customer with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/customers/:id
 * Delete a customer by ID.
 */
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"DELETE FROM customers WHERE id = $1 RETURNING id",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Customer with ID ${id} not found for deletion.`);
			return res.status(404).json({ error: "Customer not found." });
		}
		logger.info(`Customer with ID ${id} deleted successfully.`);
		res.status(200).json({ message: "Customer deleted successfully." });
	} catch (error) {
		logger.error(`Error deleting customer with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
