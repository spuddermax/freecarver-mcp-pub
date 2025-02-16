// /api/routes/v1/productOptions.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import validateRequest from "../../middleware/validateRequest.js";

import {
	createProductOptionSchema,
	updateProductOptionSchema,
	productOptionIdSchema,
} from "../../validators/productOptions.js";

const router = express.Router();

// Protect all routes in this file
router.use(verifyJWT);

/**
 * @route GET /v1/product-options
 * @description Retrieve a list of all product options.
 * @access Protected
 * @returns {Response} 200 - JSON object containing an array of product options.
 * @returns {Response} 500 - Internal server error.
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
 * @route POST /v1/product-options
 * @description Create a new product option.
 * @access Protected
 * @param {Object} req.body - The product option details.
 * @param {string} req.body.option_name - The name of the option (required).
 * @returns {Response} 201 - JSON object containing the newly created product option.
 * @returns {Response} 422 - Validation error if 'option_name' is missing.
 * @returns {Response} 500 - Internal server error.
 */
router.post(
	"/",
	validateRequest(createProductOptionSchema),
	async (req, res) => {
		try {
			const { option_name } = req.body;
			const result = await pool.query(
				"INSERT INTO product_options (option_name) VALUES ($1) RETURNING *",
				[option_name]
			);
			logger.info(`Product option created successfully: ${option_name}`);
			res.success(
				{ option: result.rows[0] },
				"Product option created successfully",
				201
			);
		} catch (error) {
			logger.error("Error creating product option.", {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/product-options/:id
 * @description Retrieve details for a specific product option by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product option.
 * @returns {Response} 200 - JSON object containing the product option details.
 * @returns {Response} 404 - Not found if the product option does not exist.
 * @returns {Response} 422 - Validation error if ID is invalid.
 * @returns {Response} 500 - Internal server error.
 */
router.get(
	"/:id",
	validateRequest(productOptionIdSchema, "params"),
	async (req, res) => {
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
	}
);

/**
 * @route PUT /v1/product-options/:id
 * @description Update an existing product option.
 * @access Protected
 * @param {string} req.params.id - The ID of the product option to update.
 * @param {Object} req.body - The updated product option details.
 * @param {string} req.body.option_name - The updated option name (required).
 * @returns {Response} 200 - JSON object containing the updated product option.
 * @returns {Response} 422 - Validation error if 'option_name' is missing or ID is invalid.
 * @returns {Response} 404 - Not found if the product option does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.put(
	"/:id",
	validateRequest(productOptionIdSchema, "params"),
	validateRequest(updateProductOptionSchema),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { option_name } = req.body;
			const result = await pool.query(
				"UPDATE product_options SET option_name = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
				[option_name, id]
			);
			if (result.rows.length === 0) {
				logger.error(
					`Product option with ID ${id} not found for update.`
				);
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
	}
);

/**
 * @route DELETE /v1/product-options/:id
 * @description Delete a product option by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product option to delete.
 * @returns {Response} 200 - JSON object indicating successful deletion.
 * @returns {Response} 422 - Validation error if ID is invalid.
 * @returns {Response} 404 - Not found if the product option does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.delete(
	"/:id",
	validateRequest(productOptionIdSchema, "params"),
	async (req, res) => {
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
	}
);

/**
 * @route GET /v1/product-options/:optionId/variants
 * @description Retrieve all variants for a given product option.
 * @access Protected
 * @param {string} req.params.optionId - The ID of the product option.
 * @returns {Response} 200 - JSON object containing an array of variants.
 * @returns {Response} 500 - Internal server error.
 */
const variantsRouter = express.Router({ mergeParams: true });
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
 * @route POST /v1/product-options/:optionId/variants
 * @description Create a new variant for a given product option.
 * @access Protected
 * @param {string} req.params.optionId - The ID of the product option.
 * @param {Object} req.body - The variant details.
 * @param {string} req.body.option_value - The value of the variant (required).
 * @returns {Response} 201 - JSON object containing the newly created variant.
 * @returns {Response} 400 - Bad request if 'option_value' is missing.
 * @returns {Response} 500 - Internal server error.
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
 * @route GET /v1/product-options/:optionId/variants/:variantId
 * @description Retrieve a specific variant for a given product option.
 * @access Protected
 * @param {string} req.params.optionId - The ID of the product option.
 * @param {string} req.params.variantId - The ID of the variant.
 * @returns {Response} 200 - JSON object containing the variant details.
 * @returns {Response} 404 - Not found if the variant does not exist.
 * @returns {Response} 500 - Internal server error.
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
 * @route PUT /v1/product-options/:optionId/variants/:variantId
 * @description Update an existing variant for a given product option.
 * @access Protected
 * @param {string} req.params.optionId - The ID of the product option.
 * @param {string} req.params.variantId - The ID of the variant to update.
 * @param {Object} req.body - The updated variant details.
 * @param {string} req.body.option_value - The updated variant value (required).
 * @returns {Response} 200 - JSON object containing the updated variant.
 * @returns {Response} 400 - Bad request if 'option_value' is missing.
 * @returns {Response} 404 - Not found if the variant does not exist.
 * @returns {Response} 500 - Internal server error.
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
 * @route DELETE /v1/product-options/:optionId/variants/:variantId
 * @description Delete a variant for a given product option.
 * @access Protected
 * @param {string} req.params.optionId - The ID of the product option.
 * @param {string} req.params.variantId - The ID of the variant to delete.
 * @returns {Response} 200 - JSON object indicating successful deletion.
 * @returns {Response} 404 - Not found if the variant does not exist.
 * @returns {Response} 500 - Internal server error.
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
