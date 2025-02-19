// /api/routes/v1/products.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import validateRequest from "../../middleware/validateRequest.js";
import {
	productListSchema,
	createOrUpdateProductSchema,
	productIdSchema,
} from "../../validators/products.js";

const router = express.Router();

router.use(verifyJWT);

/**
 * @route GET /v1/products
 * @description Retrieve a list of products with pagination and ordering.
 * The endpoint supports the following query parameters:
 *   @param {number} [page=1] - The page number (default: 1).
 *   @param {number} [limit=20] - The number of products per page (default: 20).
 *   @param {string} [orderBy=name] - The column to order by. Allowed columns:
 *           [id, name, price, sale_price, created_at, updated_at] (default: name).
 *   @param {string} [order=asc] - The order direction: "asc" (ascending) or "desc" (descending) (default: asc).
 * @access Protected
 * @returns {Response} 200 - JSON object containing the total number of products and an array of products.
 * @returns {Response} 500 - Internal server error.
 */
router.get(
	"/",
	validateRequest(productListSchema, "query"),
	async (req, res) => {
		try {
			// Default pagination values
			const page = parseInt(req.query.page, 10) || 1;
			const limit = parseInt(req.query.limit, 10) || 20;
			const offset = (page - 1) * limit;

			// Allowed columns for ordering
			const allowedOrderColumns = [
				"id",
				"name",
				"price",
				"sale_price",
				"created_at",
				"updated_at",
			];
			const orderBy = allowedOrderColumns.includes(req.query.orderBy)
				? req.query.orderBy
				: "name";
			const orderDirection =
				req.query.order && req.query.order.toLowerCase() === "desc"
					? "DESC"
					: "ASC";

			// Query the total number of products
			const countResult = await pool.query(
				"SELECT COUNT(*) FROM products"
			);
			const total = parseInt(countResult.rows[0].count, 10);

			// Paginated query
			const query = `SELECT * FROM products ORDER BY ${orderBy} ${orderDirection} LIMIT $1 OFFSET $2`;
			const result = await pool.query(query, [limit, offset]);

			logger.info("Retrieved products list with pagination.", {
				page,
				limit,
				orderBy,
				orderDirection,
			});
			res.success(
				{ total, products: result.rows },
				"Products retrieved successfully"
			);
		} catch (error) {
			logger.error("Error retrieving products list.", {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route POST /v1/products
 * @description Create a new product.
 * @access Protected
 * @param {Object} req.body - The product details.
 * @param {string} req.body.name - The name of the product (required).
 * @param {string} [req.body.description] - The description of the product.
 * @param {number} [req.body.price] - The price of the product.
 * @param {number} [req.body.sale_price] - The sale price of the product.
 * @param {string} [req.body.sale_start] - The sale start date.
 * @param {string} [req.body.sale_end] - The sale end date.
 * @param {Object} [req.body.product_media] - JSON data for product media.
 * @returns {Response} 201 - JSON object containing the newly created product.
 * @returns {Response} 400 - Bad request if 'name' is missing.
 * @returns {Response} 500 - Internal server error.
 */
router.post(
	"/",
	validateRequest(createOrUpdateProductSchema, "body"),
	async (req, res) => {
		try {
			const {
				name,
				description,
				price,
				sale_price,
				sale_start,
				sale_end,
				product_media,
			} = req.body;
			if (!name) {
				logger.error('Product creation failed: "name" is required.');
				return res.error('"name" is required.', 400);
			}
			const query = `
        INSERT INTO products (name, description, price, sale_price, sale_start, sale_end, product_media)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
			const values = [
				name,
				description,
				price,
				sale_price,
				sale_start,
				sale_end,
				product_media,
			];
			const result = await pool.query(query, values);
			logger.info(`Product created successfully: ${name}`);
			res.success(
				{ product: result.rows[0] },
				"Product created successfully",
				201
			);
		} catch (error) {
			logger.error("Error creating product.", { error: error.message });
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/products/:id
 * @description Retrieve details of a specific product by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product.
 * @returns {Response} 200 - JSON object containing the product details.
 * @returns {Response} 404 - Not found if the product does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.get(
	"/:id",
	validateRequest(productIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"SELECT * FROM products WHERE id = $1",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Product with ID ${id} not found.`);
				return res.error("Product not found.", 404);
			}
			logger.info(`Retrieved product with ID ${id}.`);
			res.success(
				{ product: result.rows[0] },
				"Product retrieved successfully",
				200
			);
		} catch (error) {
			logger.error(`Error retrieving product with ID ${req.params.id}.`, {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route PUT /v1/products/:id
 * @description Update an existing product.
 * @access Protected
 * @param {string} req.params.id - The ID of the product to update.
 * @param {Object} req.body - The updated product details.
 * @param {string} [req.body.name] - The updated product name.
 * @param {string} [req.body.sku] - The updated product SKU.
 * @param {string} [req.body.description] - The updated product description.
 * @param {number} [req.body.price] - The updated product price.
 * @param {number} [req.body.sale_price] - The updated sale price.
 * @param {string} [req.body.sale_start] - The updated sale start date.
 * @param {string} [req.body.sale_end] - The updated sale end date.
 * @param {Object} [req.body.product_media] - The updated product media (JSON).
 * @returns {Response} 200 - JSON object containing the updated product.
 * @returns {Response} 404 - Not found if the product does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.put(
	"/:id",
	validateRequest(productIdSchema, "params"),
	validateRequest(createOrUpdateProductSchema, "body"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const {
				name,
				description,
				price,
				sku,
				sale_price,
				sale_start,
				sale_end,
				product_media,
			} = req.body;

			// Build an object with only the fields provided
			const updateFields = {};
			if (name !== undefined) updateFields.name = name;
			if (description !== undefined)
				updateFields.description = description;
			if (sku !== undefined) updateFields.sku = sku;
			if (price !== undefined) updateFields.price = price;
			if (sale_price !== undefined) updateFields.sale_price = sale_price;
			if (sale_start !== undefined) updateFields.sale_start = sale_start;
			if (sale_end !== undefined) updateFields.sale_end = sale_end;
			if (product_media !== undefined)
				updateFields.product_media = JSON.stringify(product_media);

			// If no valid fields are provided, return an error.
			const keys = Object.keys(updateFields);
			if (keys.length === 0) {
				logger.error("No valid fields to update for product", { id });
				return res.validationError(
					{ error: "No valid fields to update." },
					"No valid fields to update."
				);
			}

			// Build dynamic SET clause and values array using a cast for product_media.
			const setClause = keys
				.map((field, index) =>
					field === "product_media"
						? `${field} = $${index + 1}::json`
						: `${field} = $${index + 1}`
				)
				.join(", ");
			const values = keys.map((key) => updateFields[key]);
			// Append the product id as the last parameter
			values.push(id);

			const queryText = `
      UPDATE products
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *;
    `;
			console.log(queryText, values);
			const result = await pool.query(queryText, values);
			if (result.rows.length === 0) {
				logger.error(`Product with ID ${id} not found for update.`);
				return res.error("Product not found.", 404);
			}
			logger.info(`Product with ID ${id} updated successfully.`);
			res.success(
				{ product: result.rows[0] },
				"Product updated successfully",
				200
			);
		} catch (error) {
			logger.error(
				`Error updating product with ID ${req.params.id}. ${error.message}`,
				{
					error: error.message,
				}
			);
			res.error("Internal server error: " + error.message, 500);
		}
	}
);

/**
 * @route DELETE /v1/products/:id
 * @description Delete a product by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product to delete.
 * @returns {Response} 204 - No content.
 * @returns {Response} 404 - Not found if the product does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.delete(
	"/:id",
	validateRequest(productIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"DELETE FROM products WHERE id = $1 RETURNING id",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Product with ID ${id} not found for deletion.`);
				return res.error("Product not found.", 404);
			}
			logger.info(`Product with ID ${id} deleted successfully.`);
			res.success(null, "Product deleted successfully", 200);
		} catch (error) {
			logger.error(`Error deleting product with ID ${req.params.id}.`, {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

export default router;
