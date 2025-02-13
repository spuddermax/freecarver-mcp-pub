// /api/routes/v1/productCategories.js

import express from "express";
import { pool } from "../../db.js";
import logger from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Protect all endpoints in this file
router.use(verifyJWT);

/**
 * GET /v1/product-categories
 * Retrieve a list of all product categories.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM product_categories ORDER BY id"
		);
		logger.info("Retrieved product categories list.");
		res.status(200).json({ categories: result.rows });
	} catch (error) {
		logger.error("Error retrieving product categories.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/product-categories
 * Create a new product category.
 * Required: name
 * Optional: description, parent_category_id
 */
router.post("/", async (req, res) => {
	try {
		const { name, description, parent_category_id } = req.body;
		if (!name) {
			logger.error(
				"Product category creation failed: 'name' is required."
			);
			return res.status(400).json({ error: "'name' is required." });
		}
		const query = `
      INSERT INTO product_categories (name, description, parent_category_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
		const values = [name, description || null, parent_category_id || null];
		const result = await pool.query(query, values);
		logger.info(`Product category created successfully: ${name}`);
		res.status(201).json({ category: result.rows[0] });
	} catch (error) {
		logger.error("Error creating product category.", {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/product-categories/:id
 * Retrieve details for a specific product category.
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT * FROM product_categories WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Product category with ID ${id} not found.`);
			return res
				.status(404)
				.json({ error: "Product category not found." });
		}
		logger.info(`Retrieved product category with ID ${id}.`);
		res.status(200).json({ category: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error retrieving product category with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/product-categories/:id
 * Update an existing product category.
 * Accepts: name, description, parent_category_id.
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, parent_category_id } = req.body;
		if (!name) {
			logger.error("Product category update failed: 'name' is required.");
			return res.status(400).json({ error: "'name' is required." });
		}
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
			return res
				.status(404)
				.json({ error: "Product category not found." });
		}
		logger.info(`Product category with ID ${id} updated successfully.`);
		res.status(200).json({ category: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error updating product category with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/product-categories/:id
 * Delete a product category by ID.
 */
router.delete("/:id", async (req, res) => {
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
			return res
				.status(404)
				.json({ error: "Product category not found." });
		}
		logger.info(`Product category with ID ${id} deleted successfully.`);
		res.status(200).json({
			message: "Product category deleted successfully.",
		});
	} catch (error) {
		logger.error(
			`Error deleting product category with ID ${req.params.id}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
