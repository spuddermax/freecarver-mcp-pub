// /api/routes/v1/inventory.js

import express from "express";
import { pool } from "../../db.js";
import logger from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Apply JWT authentication to all endpoints in this file.
router.use(verifyJWT);

/**
 * INVENTORY LOCATIONS ENDPOINTS
 */

/**
 * GET /v1/inventory/locations
 * Retrieve a list of all inventory locations.
 */
router.get("/locations", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM inventory_locations ORDER BY id"
		);
		logger.info("Retrieved inventory locations list.");
		res.status(200).json({ locations: result.rows });
	} catch (error) {
		logger.error("Error retrieving inventory locations.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/inventory/locations
 * Create a new inventory location.
 * Required: location_identifier.
 * Optional: description.
 */
router.post("/locations", async (req, res) => {
	try {
		const { location_identifier, description } = req.body;
		if (!location_identifier) {
			logger.error(
				"Inventory location creation failed: 'location_identifier' is required."
			);
			return res
				.status(400)
				.json({ error: "'location_identifier' is required." });
		}
		const query = `
      INSERT INTO inventory_locations (location_identifier, description)
      VALUES ($1, $2)
      RETURNING *;
    `;
		const values = [location_identifier, description || null];
		const result = await pool.query(query, values);
		logger.info(
			`Inventory location created successfully: ${location_identifier}`
		);
		res.status(201).json({ location: result.rows[0] });
	} catch (error) {
		logger.error("Error creating inventory location.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/inventory/locations/:id
 * Retrieve details for a specific inventory location by ID.
 */
router.get("/locations/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT * FROM inventory_locations WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Inventory location with ID ${id} not found.`);
			return res
				.status(404)
				.json({ error: "Inventory location not found." });
		}
		logger.info(`Retrieved inventory location with ID ${id}.`);
		res.status(200).json({ location: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error retrieving inventory location with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/inventory/locations/:id
 * Update an existing inventory location.
 * Accepts: location_identifier, description.
 */
router.put("/locations/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { location_identifier, description } = req.body;
		if (!location_identifier) {
			logger.error(
				"Inventory location update failed: 'location_identifier' is required."
			);
			return res
				.status(400)
				.json({ error: "'location_identifier' is required." });
		}
		const query = `
      UPDATE inventory_locations
      SET location_identifier = $1,
          description = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
		const values = [location_identifier, description || null, id];
		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			logger.error(
				`Inventory location with ID ${id} not found for update.`
			);
			return res
				.status(404)
				.json({ error: "Inventory location not found." });
		}
		logger.info(`Inventory location with ID ${id} updated successfully.`);
		res.status(200).json({ location: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error updating inventory location with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/inventory/locations/:id
 * Delete an inventory location by ID.
 */
router.delete("/locations/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"DELETE FROM inventory_locations WHERE id = $1 RETURNING id",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Inventory location with ID ${id} not found for deletion.`
			);
			return res
				.status(404)
				.json({ error: "Inventory location not found." });
		}
		logger.info(`Inventory location with ID ${id} deleted successfully.`);
		res.status(200).json({
			message: "Inventory location deleted successfully.",
		});
	} catch (error) {
		logger.error(
			`Error deleting inventory location with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * INVENTORY PRODUCTS ENDPOINTS
 */

/**
 * GET /v1/inventory/products
 * Retrieve a list of all inventory product records.
 */
router.get("/products", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM inventory_products ORDER BY id"
		);
		logger.info("Retrieved inventory products list.");
		res.status(200).json({ products: result.rows });
	} catch (error) {
		logger.error("Error retrieving inventory products.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/inventory/products
 * Create or update an inventory product record.
 * Required: product_id, location_id, quantity.
 */
router.post("/products", async (req, res) => {
	try {
		const { product_id, location_id, quantity } = req.body;
		if (!product_id || !location_id || quantity === undefined) {
			logger.error(
				"Inventory product creation failed: product_id, location_id, and quantity are required."
			);
			return res
				.status(400)
				.json({
					error: "product_id, location_id, and quantity are required.",
				});
		}
		// Check if an inventory record already exists for this product and location.
		const checkResult = await pool.query(
			"SELECT * FROM inventory_products WHERE product_id = $1 AND location_id = $2",
			[product_id, location_id]
		);
		let result;
		if (checkResult.rows.length > 0) {
			// Update existing record.
			result = await pool.query(
				`UPDATE inventory_products
         SET quantity = $1,
             updated_at = NOW()
         WHERE product_id = $2 AND location_id = $3
         RETURNING *;`,
				[quantity, product_id, location_id]
			);
		} else {
			// Insert a new record.
			result = await pool.query(
				`INSERT INTO inventory_products (product_id, location_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING *;`,
				[product_id, location_id, quantity]
			);
		}
		logger.info(
			`Inventory product record processed for product_id ${product_id} at location_id ${location_id}.`
		);
		res.status(201).json({ product: result.rows[0] });
	} catch (error) {
		logger.error("Error processing inventory product record.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/inventory/products/:id
 * Retrieve details for a specific inventory product record.
 */
router.get("/products/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT * FROM inventory_products WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Inventory product record with ID ${id} not found.`);
			return res
				.status(404)
				.json({ error: "Inventory product record not found." });
		}
		logger.info(`Retrieved inventory product record with ID ${id}.`);
		res.status(200).json({ product: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error retrieving inventory product record with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/inventory/products/:id
 * Update an existing inventory product record.
 * Accepts: product_id, location_id, quantity.
 */
router.put("/products/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { product_id, location_id, quantity } = req.body;
		if (!product_id || !location_id || quantity === undefined) {
			logger.error(
				"Inventory product update failed: product_id, location_id, and quantity are required."
			);
			return res
				.status(400)
				.json({
					error: "product_id, location_id, and quantity are required.",
				});
		}
		const query = `
      UPDATE inventory_products
      SET product_id = $1,
          location_id = $2,
          quantity = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
		const values = [product_id, location_id, quantity, id];
		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			logger.error(
				`Inventory product record with ID ${id} not found for update.`
			);
			return res
				.status(404)
				.json({ error: "Inventory product record not found." });
		}
		logger.info(
			`Inventory product record with ID ${id} updated successfully.`
		);
		res.status(200).json({ product: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error updating inventory product record with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/inventory/products/:id
 * Delete an inventory product record by ID.
 */
router.delete("/products/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"DELETE FROM inventory_products WHERE id = $1 RETURNING id",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Inventory product record with ID ${id} not found for deletion.`
			);
			return res
				.status(404)
				.json({ error: "Inventory product record not found." });
		}
		logger.info(
			`Inventory product record with ID ${id} deleted successfully.`
		);
		res.status(200).json({
			message: "Inventory product record deleted successfully.",
		});
	} catch (error) {
		logger.error(
			`Error deleting inventory product record with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
