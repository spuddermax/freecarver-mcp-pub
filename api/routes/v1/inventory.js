// /api/routes/v1/inventory.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../middleware/logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import validateRequest from "../../middleware/validateRequest.js";
import {
	createInventoryLocationSchema,
	updateInventoryLocationSchema,
	inventoryLocationIdSchema,
	createOrUpdateInventoryProductSchema,
	inventoryProductIdSchema,
} from "../../validators/inventory.js";

const router = express.Router();

// Apply JWT authentication to all endpoints in this file.
router.use(verifyJWT);

/**
 * @route GET /v1/inventory/locations
 * @description Retrieve a list of all inventory locations.
 * @access Protected
 * @returns {Response} 200 - Returns a JSON object containing an array of inventory locations.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.get("/locations", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM inventory_locations ORDER BY id"
		);
		logger.info("Retrieved inventory locations list.");
		res.success(
			{ locations: result.rows },
			"Inventory locations retrieved successfully",
			200
		);
	} catch (error) {
		logger.error("Error retrieving inventory locations.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/inventory/locations
 * @description Create a new inventory location.
 * @access Protected
 * @param {Object} req.body - The request body.
 * @param {string} req.body.location_identifier - The unique identifier for the location (required).
 * @param {string} [req.body.description] - A description of the location.
 * @returns {Response} 201 - Returns a JSON object containing the newly created inventory location.
 * @returns {Response} 400 - Returns an error if the location_identifier is missing.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.post(
	"/locations",
	validateRequest(createInventoryLocationSchema),
	async (req, res) => {
		try {
			const { location_identifier, description } = req.body;
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
			res.success(
				{ location: result.rows[0] },
				"Inventory location created successfully",
				201
			);
		} catch (error) {
			logger.error("Error creating inventory location.", {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/inventory/locations/:id
 * @description Retrieve details for a specific inventory location by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the inventory location.
 * @returns {Response} 200 - Returns a JSON object containing the inventory location details.
 * @returns {Response} 404 - Returns an error if the inventory location is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.get(
	"/locations/:id",
	validateRequest(inventoryLocationIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"SELECT * FROM inventory_locations WHERE id = $1",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Inventory location with ID ${id} not found.`);
				return res.error("Inventory location not found.", 404);
			}
			logger.info(`Retrieved inventory location with ID ${id}.`);
			res.success(
				{ location: result.rows[0] },
				"Inventory location retrieved successfully",
				200
			);
		} catch (error) {
			logger.error(
				`Error retrieving inventory location with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route PUT /v1/inventory/locations/:id
 * @description Update an existing inventory location.
 * @access Protected
 * @param {string} req.params.id - The ID of the inventory location to update.
 * @param {Object} req.body - The updated inventory location details.
 * @param {string} req.body.location_identifier - The updated location identifier (required).
 * @param {string} [req.body.description] - The updated description.
 * @returns {Response} 200 - Returns a JSON object containing the updated inventory location.
 * @returns {Response} 400 - Returns an error if the location_identifier is missing.
 * @returns {Response} 404 - Returns an error if the inventory location is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.put(
	"/locations/:id",
	validateRequest(inventoryLocationIdSchema, "params"),
	validateRequest(updateInventoryLocationSchema),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { location_identifier, description } = req.body;
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
				return res.error("Inventory location not found.", 404);
			}
			logger.info(
				`Inventory location with ID ${id} updated successfully.`
			);
			res.success(
				{ location: result.rows[0] },
				"Inventory location updated successfully",
				200
			);
		} catch (error) {
			logger.error(
				`Error updating inventory location with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route DELETE /v1/inventory/locations/:id
 * @description Delete an inventory location by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the inventory location to delete.
 * @returns {Response} 200 - Returns a JSON object indicating successful deletion.
 * @returns {Response} 404 - Returns an error if the inventory location is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.delete(
	"/locations/:id",
	validateRequest(inventoryLocationIdSchema, "params"),
	async (req, res) => {
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
				return res.error("Inventory location not found.", 404);
			}
			logger.info(
				`Inventory location with ID ${id} deleted successfully.`
			);
			res.success(null, "Inventory location deleted successfully", 200);
		} catch (error) {
			logger.error(
				`Error deleting inventory location with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/inventory/products
 * @description Retrieve a list of all inventory product records.
 * @access Protected
 * @returns {Response} 200 - Returns a JSON object containing an array of inventory products.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.get("/products", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM inventory_products ORDER BY id"
		);
		logger.info("Retrieved inventory products list.");
		res.success(
			{ products: result.rows },
			"Inventory products retrieved successfully",
			200
		);
	} catch (error) {
		logger.error("Error retrieving inventory products.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/inventory/products
 * @description Create or update an inventory product record.
 * @access Protected
 * @param {Object} req.body - The request body.
 * @param {number} req.body.product_id - The product ID (required).
 * @param {number} req.body.location_id - The location ID (required).
 * @param {number} req.body.quantity - The quantity (required).
 * @returns {Response} 201 - Returns a JSON object containing the inventory product record.
 * @returns {Response} 400 - Returns an error if product_id, location_id, or quantity is missing.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.post(
	"/products",
	validateRequest(createOrUpdateInventoryProductSchema),
	async (req, res) => {
		try {
			const { product_id, location_id, quantity } = req.body;
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
			res.success(
				{ product: result.rows[0] },
				"Inventory product record processed successfully",
				201
			);
		} catch (error) {
			logger.error("Error processing inventory product record.", {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/inventory/products/:id
 * @description Retrieve details for a specific inventory product record.
 * @access Protected
 * @param {string} req.params.id - The ID of the inventory product record.
 * @returns {Response} 200 - Returns a JSON object containing the inventory product record.
 * @returns {Response} 404 - Returns an error if the inventory product record is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.get(
	"/products/:id",
	validateRequest(inventoryProductIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"SELECT * FROM inventory_products WHERE id = $1",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(
					`Inventory product record with ID ${id} not found.`
				);
				return res.error("Inventory product record not found.", 404);
			}
			logger.info(`Retrieved inventory product record with ID ${id}.`);
			res.success(
				{ product: result.rows[0] },
				"Inventory product record retrieved successfully",
				200
			);
		} catch (error) {
			logger.error(
				`Error retrieving inventory product record with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route PUT /v1/inventory/products/:id
 * @description Update an existing inventory product record.
 * @access Protected
 * @param {string} req.params.id - The ID of the inventory product record to update.
 * @param {Object} req.body - The updated inventory product details.
 * @param {number} req.body.product_id - The updated product ID (required).
 * @param {number} req.body.location_id - The updated location ID (required).
 * @param {number} req.body.quantity - The updated quantity (required).
 * @returns {Response} 200 - Returns a JSON object containing the updated inventory product record.
 * @returns {Response} 400 - Returns an error if required fields are missing.
 * @returns {Response} 404 - Returns an error if the inventory product record is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.put(
	"/products/:id",
	validateRequest(inventoryProductIdSchema, "params"),
	validateRequest(createOrUpdateInventoryProductSchema),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { product_id, location_id, quantity } = req.body;
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
				return res.error("Inventory product record not found.", 404);
			}
			logger.info(
				`Inventory product record with ID ${id} updated successfully.`
			);
			res.success(
				{ product: result.rows[0] },
				"Inventory product record updated successfully",
				200
			);
		} catch (error) {
			logger.error(
				`Error updating inventory product record with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route DELETE /v1/inventory/products/:id
 * @description Delete an inventory product record by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the inventory product record to delete.
 * @returns {Response} 200 - Returns a JSON object indicating successful deletion.
 * @returns {Response} 404 - Returns an error if the inventory product record is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.delete(
	"/products/:id",
	validateRequest(inventoryProductIdSchema, "params"),
	async (req, res) => {
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
				return res.error("Inventory product record not found.", 404);
			}
			logger.info(
				`Inventory product record with ID ${id} deleted successfully.`
			);
			res.success(
				null,
				"Inventory product record deleted successfully",
				200
			);
		} catch (error) {
			logger.error(
				`Error deleting inventory product record with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

export default router;
