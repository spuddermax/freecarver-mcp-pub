// /api/routes/v1/productOptions.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Protect all routes in this file
router.use(verifyJWT);

/**
 * GET /v1/product-options
 * Retrieve a list of all product options.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM product_options ORDER BY id"
		);
		logger.info("Retrieved product options list.");
		res.success(
			{ options: result.rows },
			"Product options retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving product options.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * POST /v1/product-options
 * Create a new product option.
 * Required: option_name
 */
router.post("/", async (req, res) => {
	try {
		const { option_name } = req.body;
		if (!option_name) {
			logger.error(
				'Product option creation failed: "option_name" is required.'
			);
			return res.error('"option_name" is required.', 400);
		}
		const result = await pool.query(
			"INSERT INTO product_options (option_name) VALUES ($1) RETURNING *",
			[option_name]
		);
		logger.info(`Product option created successfully: ${option_name}`);
		res.success(
			{ option: result.rows[0] },
			"Product option created successfully"
		);
	} catch (error) {
		logger.error("Error creating product option.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * GET /v1/product-options/:id
 * Retrieve details for a specific product option by ID.
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT * FROM product_options WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Product option with ID ${id} not found.`);
			return res.error("Product option not found.", 404);
		}
		logger.info(`Retrieved product option with ID ${id}.`);
		res.success(
			{ option: result.rows[0] },
			"Product option retrieved successfully"
		);
	} catch (error) {
		logger.error(
			`Error retrieving product option with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * PUT /v1/product-options/:id
 * Update an existing product option.
 * Accepts: option_name.
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { option_name } = req.body;
		if (!option_name) {
			logger.error(
				'Update product option failed: "option_name" is required.'
			);
			return res.error('"option_name" is required.', 400);
		}
		const result = await pool.query(
			"UPDATE product_options SET option_name = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
			[option_name, id]
		);
		if (result.rows.length === 0) {
			logger.error(`Product option with ID ${id} not found for update.`);
			return res.error("Product option not found.", 404);
		}
		logger.info(`Product option with ID ${id} updated successfully.`);
		res.success(
			{ option: result.rows[0] },
			"Product option updated successfully"
		);
	} catch (error) {
		logger.error(
			`Error updating product option with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * DELETE /v1/product-options/:id
 * Delete a product option by ID.
 */
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"DELETE FROM product_options WHERE id = $1 RETURNING id",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Product option with ID ${id} not found for deletion.`
			);
			return res.error("Product option not found.", 404);
		}
		logger.info(`Product option with ID ${id} deleted successfully.`);
		res.success(null, "Product option deleted successfully");
	} catch (error) {
		logger.error(
			`Error deleting product option with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * Nested routes for product option variants.
 */
const variantsRouter = express.Router({ mergeParams: true });

/**
 * GET /v1/product-options/:optionId/variants
 * Retrieve all variants for a given product option.
 */
variantsRouter.get("/", async (req, res) => {
	try {
		const { optionId } = req.params;
		const result = await pool.query(
			"SELECT * FROM product_option_variants WHERE option_id = $1 ORDER BY id",
			[optionId]
		);
		logger.info(`Retrieved variants for product option ID ${optionId}.`);
		res.success(
			{ variants: result.rows },
			"Variants retrieved successfully"
		);
	} catch (error) {
		logger.error(
			`Error retrieving variants for product option ID ${req.params.optionId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * POST /v1/product-options/:optionId/variants
 * Create a new variant for a given product option.
 * Required: option_value.
 */
variantsRouter.post("/", async (req, res) => {
	try {
		const { optionId } = req.params;
		const { option_value } = req.body;
		if (!option_value) {
			logger.error(
				'Variant creation failed: "option_value" is required.'
			);
			return res.error('"option_value" is required.', 400);
		}
		const result = await pool.query(
			"INSERT INTO product_option_variants (option_id, option_value) VALUES ($1, $2) RETURNING *",
			[optionId, option_value]
		);
		logger.info(
			`Variant created successfully for product option ID ${optionId}.`
		);
		res.success(
			{ variant: result.rows[0] },
			"Variant created successfully"
		);
	} catch (error) {
		logger.error(
			`Error creating variant for product option ID ${req.params.optionId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * GET /v1/product-options/:optionId/variants/:variantId
 * Retrieve a specific variant for a given product option.
 */
variantsRouter.get("/:variantId", async (req, res) => {
	try {
		const { optionId, variantId } = req.params;
		const result = await pool.query(
			"SELECT * FROM product_option_variants WHERE option_id = $1 AND id = $2",
			[optionId, variantId]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Variant with ID ${variantId} for product option ${optionId} not found.`
			);
			return res.error("Variant not found.", 404);
		}
		logger.info(
			`Retrieved variant with ID ${variantId} for product option ${optionId}.`
		);
		res.success(
			{ variant: result.rows[0] },
			"Variant retrieved successfully"
		);
	} catch (error) {
		logger.error(
			`Error retrieving variant with ID ${req.params.variantId} for product option ${req.params.optionId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * PUT /v1/product-options/:optionId/variants/:variantId
 * Update an existing variant for a given product option.
 * Accepts: option_value.
 */
variantsRouter.put("/:variantId", async (req, res) => {
	try {
		const { optionId, variantId } = req.params;
		const { option_value } = req.body;
		if (!option_value) {
			logger.error('Variant update failed: "option_value" is required.');
			return res.error('"option_value" is required.', 400);
		}
		const result = await pool.query(
			"UPDATE product_option_variants SET option_value = $1, updated_at = NOW() WHERE option_id = $2 AND id = $3 RETURNING *",
			[option_value, optionId, variantId]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Variant with ID ${variantId} for product option ${optionId} not found for update.`
			);
			return res.error("Variant not found.", 404);
		}
		logger.info(
			`Variant with ID ${variantId} for product option ${optionId} updated successfully.`
		);
		res.success(
			{ variant: result.rows[0] },
			"Variant updated successfully"
		);
	} catch (error) {
		logger.error(
			`Error updating variant with ID ${req.params.variantId} for product option ${req.params.optionId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * DELETE /v1/product-options/:optionId/variants/:variantId
 * Delete a variant for a given product option.
 */
variantsRouter.delete("/:variantId", async (req, res) => {
	try {
		const { optionId, variantId } = req.params;
		const result = await pool.query(
			"DELETE FROM product_option_variants WHERE option_id = $1 AND id = $2 RETURNING id",
			[optionId, variantId]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Variant with ID ${variantId} for product option ${optionId} not found for deletion.`
			);
			return res.error("Variant not found.", 404);
		}
		logger.info(
			`Variant with ID ${variantId} for product option ${optionId} deleted successfully.`
		);
		res.success(null, "Variant deleted successfully");
	} catch (error) {
		logger.error(
			`Error deleting variant with ID ${req.params.variantId} for product option ${req.params.optionId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

// Mount the variants router under the path /:optionId/variants
router.use("/:optionId/variants", variantsRouter);

export default router;
