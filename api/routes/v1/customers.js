// /api/routes/v1/customers.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import bcrypt from "bcrypt";
import validateRequest from "../../middleware/validateRequest.js";
import {
	createCustomerSchema,
	updateCustomerSchema,
	customerIdSchema,
} from "../../validators/customers.js";

const router = express.Router();

// Apply JWT authentication to all routes in this file.
router.use(verifyJWT);

/**
 * @route GET /v1/customers
 * @description Retrieve a list of all customers.
 * @access Protected
 * @returns {Response} 200 - JSON object containing an array of customers.
 * @returns {Response} 500 - Internal server error.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT id, email, first_name, last_name, phone_number, created_at, updated_at FROM customers ORDER BY id"
		);
		logger.info("Retrieved customers list.");
		res.success(
			{ customers: result.rows },
			"Customers retrieved successfully",
			200
		);
	} catch (error) {
		logger.error("Error retrieving customers list.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/customers
 * @description Create a new customer.
 * @access Protected
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The customer's email (required).
 * @param {string} req.body.password - The customer's password (required).
 * @param {string} [req.body.first_name] - The customer's first name.
 * @param {string} [req.body.last_name] - The customer's last name.
 * @param {string} [req.body.phone_number] - The customer's phone number.
 * @returns {Response} 201 - JSON object containing the newly created customer.
 * @returns {Response} 400 - Validation error if required fields are missing/invalid.
 * @returns {Response} 500 - Internal server error.
 */
router.post(
	"/",
	validateRequest(createCustomerSchema, "body"),
	async (req, res) => {
		try {
			const { email, password, first_name, last_name, phone_number } =
				req.body;
			// Hash the password using bcrypt.
			const passwordHash = await bcrypt.hash(password, 10);
			const result = await pool.query(
				`INSERT INTO customers (email, password_hash, first_name, last_name, phone_number)
				 VALUES ($1, $2, $3, $4, $5)
				 RETURNING id, email, first_name, last_name, phone_number, created_at, updated_at`,
				[email, passwordHash, first_name, last_name, phone_number]
			);
			logger.info(`Customer created successfully with email: ${email}`);
			res.success(
				{ customer: result.rows[0] },
				"Customer created successfully",
				201
			);
		} catch (error) {
			logger.error("Error creating customer.", { error: error.message });
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/customers/:id
 * @description Retrieve details for a specific customer by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the customer.
 * @returns {Response} 200 - Returns a JSON object containing the customer details.
 * @returns {Response} 404 - Returns an error if the customer is not found.
 * @returns {Response} 500 - Returns an error message for internal server error.
 */
router.get(
	"/:id",
	validateRequest(customerIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"SELECT id, email, first_name, last_name, phone_number, created_at, updated_at FROM customers WHERE id = $1",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Customer with ID ${id} not found.`);
				return res.error("Customer not found.", 404);
			}
			logger.info(`Retrieved customer with ID ${id}.`);
			res.success(
				{ customer: result.rows[0] },
				"Customer retrieved successfully",
				200
			);
		} catch (error) {
			logger.error(
				`Error retrieving customer with ID ${req.params.id}.`,
				{
					error: error.message,
				}
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route PUT /v1/customers/:id
 * @description Update an existing customer's details.
 * @access Protected
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The customer's email (required).
 * @param {string} [req.body.first_name] - The customer's first name.
 * @param {string} [req.body.last_name] - The customer's last name.
 * @param {string} [req.body.phone_number] - The customer's phone number.
 * @returns {Response} 200 - JSON object containing the updated customer.
 * @returns {Response} 400 - Validation error if required fields are missing/invalid.
 * @returns {Response} 404 - Customer not found.
 * @returns {Response} 500 - Internal server error.
 */
router.put(
	"/:id",
	validateRequest(customerIdSchema, "params"),
	validateRequest(updateCustomerSchema, "body"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { email, first_name, last_name, phone_number } = req.body;
			const result = await pool.query(
				`UPDATE customers 
				 SET email = $1, first_name = $2, last_name = $3, phone_number = $4, updated_at = NOW()
				 WHERE id = $5
				 RETURNING id, email, first_name, last_name, phone_number, created_at, updated_at`,
				[email, first_name, last_name, phone_number, id]
			);
			if (result.rows.length === 0) {
				logger.error(`Customer with ID ${id} not found for update.`);
				return res.error("Customer not found.", 404);
			}
			logger.info(`Customer with ID ${id} updated successfully.`);
			res.success(
				{ customer: result.rows[0] },
				"Customer updated successfully",
				200
			);
		} catch (error) {
			logger.error(`Error updating customer with ID ${req.params.id}.`, {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route DELETE /v1/customers/:id
 * @description Delete a customer by ID.
 * @access Protected
 * @returns {Response} 200 - JSON object indicating successful deletion.
 * @returns {Response} 404 - Customer not found.
 * @returns {Response} 500 - Internal server error.
 */
router.delete(
	"/:id",
	validateRequest(customerIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"DELETE FROM customers WHERE id = $1 RETURNING id",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Customer with ID ${id} not found for deletion.`);
				return res.error("Customer not found.", 404);
			}
			logger.info(`Customer with ID ${id} deleted successfully.`);
			res.success(null, "Customer deleted successfully", 200);
		} catch (error) {
			logger.error(`Error deleting customer with ID ${req.params.id}.`, {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

export default router;
