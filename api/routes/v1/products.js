// /api/routes/v1/products.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

router.use(verifyJWT);

/**
 * @route GET /v1/products
 * @description Retrieve a list of all products.
 * @access Protected
 * @returns {Response} 200 - JSON object containing an array of products.
 * @returns {Response} 500 - Internal server error.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query("SELECT * FROM products ORDER BY id");
		logger.info("Retrieved products list.");
		res.success(
			{ products: result.rows },
			"Products retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving products list.", {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

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
router.post("/", async (req, res) => {
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
			"Product created successfully"
		);
	} catch (error) {
		logger.error("Error creating product.", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/products/:id
 * @description Retrieve details of a specific product by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product.
 * @returns {Response} 200 - JSON object containing the product details.
 * @returns {Response} 404 - Not found if the product does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.get("/:id", async (req, res) => {
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
			"Product retrieved successfully"
		);
	} catch (error) {
		logger.error(`Error retrieving product with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route PUT /v1/products/:id
 * @description Update an existing product.
 * @access Protected
 * @param {string} req.params.id - The ID of the product to update.
 * @param {Object} req.body - The updated product details.
 * @param {string} [req.body.name] - The updated product name.
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
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const {
			name,
			description,
			price,
			sale_price,
			sale_start,
			sale_end,
			product_media,
		} = req.body;
		const query = `
      UPDATE products
      SET name = $1,
          description = $2,
          price = $3,
          sale_price = $4,
          sale_start = $5,
          sale_end = $6,
          product_media = $7,
          updated_at = NOW()
      WHERE id = $8
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
			id,
		];
		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			logger.error(`Product with ID ${id} not found for update.`);
			return res.error("Product not found.", 404);
		}
		logger.info(`Product with ID ${id} updated successfully.`);
		res.success(
			{ product: result.rows[0] },
			"Product updated successfully"
		);
	} catch (error) {
		logger.error(`Error updating product with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route DELETE /v1/products/:id
 * @description Delete a product by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the product to delete.
 * @returns {Response} 200 - JSON object indicating successful deletion.
 * @returns {Response} 404 - Not found if the product does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.delete("/:id", async (req, res) => {
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
		res.success(null, "Product deleted successfully");
	} catch (error) {
		logger.error(`Error deleting product with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

export default router;
