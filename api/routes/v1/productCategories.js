// /api/routes/v1/productCategories.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../middleware/logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import validateRequest from "../../middleware/validateRequest.js";

import {
	createProductCategorySchema,
	updateProductCategorySchema,
	productCategoryIdSchema,
} from "../../validators/productCategories.js";

const router = express.Router();

// Apply JWT authentication to all endpoints in this file
router.use(verifyJWT);

/**
 * @route GET /v1/product_categories
 * @description Retrieve a list of all product categories.
 * @access Protected
 * @returns {Response} 200 - JSON object containing an array of product categories.
 * @returns {Response} 500 - Internal server error.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM product_categories ORDER BY id"
		);
		logger.info("Retrieved product categories list.");
		res.success(
			{ categories: result.rows },
			"Product categories retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving product categories.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/product_categories
 * @description Create a new product category.
 * @access Protected
 * @param {Object} req.body - The product category details.
 * @param {string} req.body.name - The name of the category (required).
 * @param {string} [req.body.description] - The description of the category.
 * @param {number} [req.body.parent_category_id] - The parent category ID, if applicable.
 * @returns {Response} 201 - JSON object containing the newly created product category.
 * @returns {Response} 400 - Bad request if 'name' is missing.
 * @returns {Response} 500 - Internal server error.
 */
router.post(
	"/",
	validateRequest(createProductCategorySchema),
	async (req, res) => {
		try {
			const { name, description, parent_category_id } = req.body;
			const query = `
      INSERT INTO product_categories (name, description, parent_category_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
			const values = [
				name,
				description || null,
				parent_category_id || null,
			];
			const result = await pool.query(query, values);
			logger.info(`Product category created successfully: ${name}`);
			res.success(
				{ category: result.rows[0] },
				"Product category created successfully",
				201
			);
		} catch (error) {
			logger.error("Error creating product category.", {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/product_categories/:id
 * @description Retrieve details for a specific product category.
 * @access Protected
 * @param {string} req.params.id - The ID of the product category.
 * @returns {Response} 200 - JSON object containing the product category details.
 * @returns {Response} 404 - Not found if the product category does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.get(
	"/:id",
	validateRequest(productCategoryIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"SELECT * FROM product_categories WHERE id = $1",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Product category with ID ${id} not found.`);
				return res.error("Product category not found.", 404);
			}
			logger.info(`Retrieved product category with ID ${id}.`);
			res.success(
				{ category: result.rows[0] },
				"Product category retrieved successfully"
			);
		} catch (error) {
			logger.error(
				`Error retrieving product category with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route PUT /v1/product_categories/:id
 * @description Update an existing product category.
 * @access Protected
 * @param {string} req.params.id - The ID of the product category to update.
 * @param {Object} req.body - The updated product category details.
 * @param {string} req.body.name - The name of the category (required).
 * @param {string} [req.body.description] - The updated description.
 * @param {number} [req.body.parent_category_id] - The updated parent category ID.
 * @returns {Response} 200 - JSON object containing the updated product category.
 * @returns {Response} 400 - Bad request if 'name' is missing.
 * @returns {Response} 404 - Not found if the product category does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.put(
	"/:id",
	validateRequest(productCategoryIdSchema, "params"),
	validateRequest(updateProductCategorySchema),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { name, description, parent_category_id } = req.body;
			const query = `
      UPDATE product_categories
      SET name = $1,
          description = $2,
          parent_category_id = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
			const values = [
				name,
				description || null,
				parent_category_id || null,
				id,
			];
			const result = await pool.query(query, values);
			if (result.rows.length === 0) {
				logger.error(
					`Product category with ID ${id} not found for update.`
				);
				return res.error("Product category not found.", 404);
			}
			logger.info(`Product category with ID ${id} updated successfully.`);
			res.success(
				{ category: result.rows[0] },
				"Product category updated successfully"
			);
		} catch (error) {
			logger.error(
				`Error updating product category with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route DELETE /v1/product_categories/:id
 * @description Delete a product category by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product category to delete.
 * @returns {Response} 200 - JSON object indicating successful deletion.
 * @returns {Response} 404 - Not found if the product category does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.delete(
	"/:id",
	validateRequest(productCategoryIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"DELETE FROM product_categories WHERE id = $1 RETURNING id",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(
					`Product category with ID ${id} not found for deletion.`
				);
				return res.error("Product category not found.", 404);
			}
			logger.info(`Product category with ID ${id} deleted successfully.`);
			res.success(null, "Product category deleted successfully");
		} catch (error) {
			logger.error(
				`Error deleting product category with ID ${req.params.id}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

export default router;
