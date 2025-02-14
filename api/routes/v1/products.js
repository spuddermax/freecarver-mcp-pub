// /api/routes/v1/products.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

router.use(verifyJWT);

/**
 * GET /v1/products
 * Retrieve a list of all products.
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
 * POST /v1/products
 * Create a new product.
 * Required: name
 * Optional: description, price, sale_price, sale_start, sale_end, product_media (JSON)
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
 * GET /v1/products/:id
 * Retrieve details of a specific product by ID.
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
 * PUT /v1/products/:id
 * Update an existing product.
 * Accepts updates to: name, description, price, sale_price, sale_start, sale_end, product_media.
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
 * DELETE /v1/products/:id
 * Delete a product by ID.
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
