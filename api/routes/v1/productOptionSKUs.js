// /api/routes/v1/productOptionSKUs.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Protect all endpoints in this file
router.use(verifyJWT);

/**
 * @route GET /v1/product-option-skus
 * @description Retrieve a list of all product option SKU associations.
 * @access Protected
 * @returns {Response} 200 - JSON object containing an array of product option SKU associations.
 * @returns {Response} 500 - Internal server error.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM product_option_skus ORDER BY id"
		);
		logger.info("Retrieved product option SKUs list.");
		res.success(
			{ skus: result.rows },
			"Product option SKUs retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving product option SKUs.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/product-option-skus
 * @description Create a new product option SKU association.
 * @access Protected
 * @param {Object} req.body - The request body.
 * @param {number} req.body.product_id - The product ID (required).
 * @param {number} req.body.option_id - The option ID (required).
 * @param {number} req.body.variant_id - The variant ID (required).
 * @param {string} req.body.sku - The SKU value (required).
 * @param {number} [req.body.price] - The price.
 * @param {number} [req.body.sale_price] - The sale price.
 * @param {string} [req.body.sale_start] - The sale start date.
 * @param {string} [req.body.sale_end] - The sale end date.
 * @returns {Response} 201 - JSON object containing the newly created product option SKU association.
 * @returns {Response} 400 - Bad request if required fields are missing.
 * @returns {Response} 500 - Internal server error.
 */
router.post("/", async (req, res) => {
	try {
		const {
			product_id,
			option_id,
			variant_id,
			sku,
			price,
			sale_price,
			sale_start,
			sale_end,
		} = req.body;
		if (!product_id || !option_id || !variant_id || !sku) {
			logger.error(
				"SKU creation failed: product_id, option_id, variant_id, and sku are required."
			);
			return res.error(
				"product_id, option_id, variant_id, and sku are required.",
				400
			);
		}
		const query = `
      INSERT INTO product_option_skus (product_id, option_id, variant_id, sku, price, sale_price, sale_start, sale_end)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
		const values = [
			product_id,
			option_id,
			variant_id,
			sku,
			price,
			sale_price,
			sale_start,
			sale_end,
		];
		const result = await pool.query(query, values);
		logger.info(
			`Product option SKU created successfully for product_id ${product_id}, option_id ${option_id}, variant_id ${variant_id}.`
		);
		res.success(
			{ sku: result.rows[0] },
			"Product option SKU created successfully"
		);
	} catch (error) {
		logger.error("Error creating product option SKU.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/product-option-skus/:id
 * @description Retrieve details for a specific product option SKU by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product option SKU association.
 * @returns {Response} 200 - JSON object containing the product option SKU details.
 * @returns {Response} 404 - Not found if the product option SKU association does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT * FROM product_option_skus WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Product option SKU with ID ${id} not found.`);
			return res.error("Product option SKU not found.", 404);
		}
		logger.info(`Retrieved product option SKU with ID ${id}.`);
		res.success(
			{ sku: result.rows[0] },
			"Product option SKU retrieved successfully"
		);
	} catch (error) {
		logger.error(
			`Error retrieving product option SKU with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route PUT /v1/product-option-skus/:id
 * @description Update an existing product option SKU association.
 * @access Protected
 * @param {string} req.params.id - The ID of the product option SKU association to update.
 * @param {Object} req.body - The updated product option SKU details.
 * @param {number} req.body.product_id - The updated product ID (required).
 * @param {number} req.body.option_id - The updated option ID (required).
 * @param {number} req.body.variant_id - The updated variant ID (required).
 * @param {string} req.body.sku - The updated SKU value (required).
 * @param {number} [req.body.price] - The updated price.
 * @param {number} [req.body.sale_price] - The updated sale price.
 * @param {string} [req.body.sale_start] - The updated sale start date.
 * @param {string} [req.body.sale_end] - The updated sale end date.
 * @returns {Response} 200 - JSON object containing the updated product option SKU association.
 * @returns {Response} 400 - Bad request if required fields are missing.
 * @returns {Response} 404 - Not found if the product option SKU association does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const {
			product_id,
			option_id,
			variant_id,
			sku,
			price,
			sale_price,
			sale_start,
			sale_end,
		} = req.body;
		if (!product_id || !option_id || !variant_id || !sku) {
			logger.error(
				"SKU update failed: product_id, option_id, variant_id, and sku are required."
			);
			return res.error(
				"product_id, option_id, variant_id, and sku are required.",
				400
			);
		}
		const query = `
      UPDATE product_option_skus
      SET product_id = $1,
          option_id = $2,
          variant_id = $3,
          sku = $4,
          price = $5,
          sale_price = $6,
          sale_start = $7,
          sale_end = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *;
    `;
		const values = [
			product_id,
			option_id,
			variant_id,
			sku,
			price,
			sale_price,
			sale_start,
			sale_end,
			id,
		];
		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			logger.error(
				`Product option SKU with ID ${id} not found for update.`
			);
			return res.error("Product option SKU not found.", 404);
		}
		logger.info(`Product option SKU with ID ${id} updated successfully.`);
		res.success(
			{ sku: result.rows[0] },
			"Product option SKU updated successfully"
		);
	} catch (error) {
		logger.error(
			`Error updating product option SKU with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route DELETE /v1/product-option-skus/:id
 * @description Delete a product option SKU association by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product option SKU association to delete.
 * @returns {Response} 200 - JSON object indicating successful deletion.
 * @returns {Response} 404 - Not found if the product option SKU association does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"DELETE FROM product_option_skus WHERE id = $1 RETURNING id",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Product option SKU with ID ${id} not found for deletion.`
			);
			return res.error("Product option SKU not found.", 404);
		}
		logger.info(`Product option SKU with ID ${id} deleted successfully.`);
		res.success(null, "Product option SKU deleted successfully");
	} catch (error) {
		logger.error(
			`Error deleting product option SKU with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

export default router;
