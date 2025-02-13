// /api/routes/v1/productOptionSKUs.js

import express from "express";
import { pool } from "../../db.js";
import logger from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Protect all endpoints in this file
router.use(verifyJWT);

/**
 * GET /v1/product-option-skus
 * Retrieve a list of all product option SKU associations.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM product_option_skus ORDER BY id"
		);
		logger.info("Retrieved product option SKUs list.");
		res.status(200).json({ skus: result.rows });
	} catch (error) {
		logger.error("Error retrieving product option SKUs.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/product-option-skus
 * Create a new product option SKU association.
 * Required fields: product_id, option_id, variant_id, sku.
 * Optional fields: price, sale_price, sale_start, sale_end.
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
			return res
				.status(400)
				.json({
					error: "product_id, option_id, variant_id, and sku are required.",
				});
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
		res.status(201).json({ sku: result.rows[0] });
	} catch (error) {
		logger.error("Error creating product option SKU.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/product-option-skus/:id
 * Retrieve details for a specific product option SKU by ID.
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
			return res
				.status(404)
				.json({ error: "Product option SKU not found." });
		}
		logger.info(`Retrieved product option SKU with ID ${id}.`);
		res.status(200).json({ sku: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error retrieving product option SKU with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/product-option-skus/:id
 * Update an existing product option SKU association.
 * Accepts: product_id, option_id, variant_id, sku, price, sale_price, sale_start, sale_end.
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
			return res
				.status(400)
				.json({
					error: "product_id, option_id, variant_id, and sku are required.",
				});
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
			return res
				.status(404)
				.json({ error: "Product option SKU not found." });
		}
		logger.info(`Product option SKU with ID ${id} updated successfully.`);
		res.status(200).json({ sku: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error updating product option SKU with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/product-option-skus/:id
 * Delete a product option SKU association by ID.
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
			return res
				.status(404)
				.json({ error: "Product option SKU not found." });
		}
		logger.info(`Product option SKU with ID ${id} deleted successfully.`);
		res.status(200).json({
			message: "Product option SKU deleted successfully.",
		});
	} catch (error) {
		logger.error(
			`Error deleting product option SKU with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
