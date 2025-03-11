// /api/routes/v1/products.js

import express from "express";
import { query } from "../../db.js";
import { logger, logError } from "../../middleware/logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import validateRequest from "../../middleware/validateRequest.js";
import {
	productListSchema,
	createOrUpdateProductSchema,
	productIdSchema,
} from "../../validators/products.js";

const router = express.Router();

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
			const {
				page = 1,
				limit = 20,
				orderBy = "id",
				order = "asc",
			} = req.query;
			const offset = (page - 1) * limit;

			// Count total products for pagination
			const countResult = await query("SELECT COUNT(*) FROM products");
			const totalProducts = parseInt(countResult.rows[0].count);

			// Get products for this page
			const query_text = `SELECT * FROM products ORDER BY ${orderBy} ${order} LIMIT $1 OFFSET $2`;
			const result = await query(query_text, [limit, offset]);

			logger.info(`Retrieved products list with pagination`, {
				page,
				limit,
				orderBy,
				order,
				totalProducts,
				count: result.rows.length,
			});

			res.success(
				{
					products: result.rows,
					pagination: {
						page: parseInt(page),
						limit: parseInt(limit),
						total: totalProducts,
						pages: Math.ceil(totalProducts / limit),
					},
				},
				"Products retrieved successfully"
			);
			console.log(result.rows[0]);
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
				sku,
				name,
				description,
				price,
				sale_price,
				sale_start,
				sale_end,
				product_media = [],
			} = req.body;

			const insertQuery = `
			INSERT INTO products 
			(sku, name, description, price, sale_price, sale_start, sale_end, product_media) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING *
		`;

			const { rows } = await query(insertQuery, [
				sku,
				name,
				description,
				price,
				sale_price,
				sale_start,
				sale_end,
				product_media,
			]);

			logger.info(`Created new product with ID ${rows[0].id}`, {
				product_id: rows[0].id,
				sku,
			});

			res.success(rows[0], "Product created successfully", 201);
		} catch (error) {
			logger.error("Error creating product", { error: error.message });
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

/**
 * @route GET /v1/products/:id
 * @description Retrieve a single product along with its associated product options.
 * @access Protected
 * @returns {Response} 200 - JSON object containing product details with an "options" object.
 * @returns {Response} 404 - Product not found.
 * @returns {Response} 422 - Invalid product id (non-numeric).
 * @returns {Response} 500 - Internal server error.
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		if (!id || isNaN(id) || id < 0) {
			logger.error("Invalid product id.");
			return res.status(422).json({
				error: [{ field: "id", message: "Invalid product id." }],
			});
		}

		// Retrieve the product.
		const productResult = await query(
			"SELECT * FROM products WHERE id = $1",
			[id]
		);
		if (productResult.rows.length === 0) {
			logger.error(`Product with id ${id} not found.`);
			return res.error("Product not found.", 404);
		}
		const product = productResult.rows[0];

		// Retrieve the product options along with their variants.
		// New schema joins product_options with product_option_variants.
		const optionsResult = await query(
			`
			SELECT 
			  po.id AS option_id,
			  po.option_name,
			  pov.id AS variant_id,
			  pov.name AS variant_name,
			  pov.sku,
			  pov.price,
			  pov.sale_price,
			  pov.sale_start,
			  pov.sale_end,
			  pov.media,
			  pov.created_at,
			  pov.updated_at
			FROM product_options po
			LEFT JOIN product_option_variants pov 
			  ON pov.option_id = po.id AND pov.product_id = po.product_id
			WHERE po.product_id = $1
			ORDER BY po.id, pov.id
			`,
			[id]
		);

		//console.log(optionsResult.rows);

		// Build initialOptions: group by option id.
		const optionsMap = {};
		// Build initialSKUs: list of combinations (assumed variant names with spaces).
		const skuList = [];

		optionsResult.rows.forEach((row) => {
			console.log(row);
			// Group by product option.
			if (!optionsMap[row.option_id]) {
				optionsMap[row.option_id] = {
					option_id: row.option_id,
					option_name: row.option_name,
					variants: [
						{
							variant_id: row.variant_id,
							variant_name: row.variant_name,
							sku: row.sku,
							price: row.price,
							sale_price: row.sale_price,
							sale_start: row.sale_start,
							sale_end: row.sale_end,
							media: row.media,
							created_at: row.created_at,
							updated_at: row.updated_at,
						},
					],
				};
			} else {
				optionsMap[row.option_id].variants.push({
					variant_id: row.variant_id,
					variant_name: row.variant_name,
					sku: row.sku,
					price: row.price,
					sale_price: row.sale_price,
					sale_start: row.sale_start,
					sale_end: row.sale_end,
					media: row.media,
					created_at: row.created_at,
					updated_at: row.updated_at,
				});
			}
		});

		const initialOptions = Object.values(optionsMap);

		product.options = initialOptions;

		logger.info(
			`Product with id ${id} retrieved successfully with options.`
		);
		res.success({ product }, "Product retrieved successfully");
	} catch (error) {
		logError(
			`Error retrieving product with options: ${req.params.id}`,
			error,
			{ productId: req.params.id }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/products/:id/options
 * @description Retrieve all options and their variants for a specific product.
 * @access Protected
 * @param {string} req.params.id - The ID of the product.
 * @returns {Response} 200 - JSON object containing an array of options with their variants.
 * @returns {Response} 404 - Not found if the product does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.get(
	"/:id/options",
	validateRequest(productIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;

			// Verify the product exists
			const productResult = await query(
				"SELECT id FROM products WHERE id = $1",
				[id]
			);

			if (productResult.rows.length === 0) {
				logger.error(
					`Product with ID ${id} not found for retrieving options.`
				);
				return res.error("Product not found.", 404);
			}

			// Retrieve the product options along with their variants.
			const optionsResult = await query(
				`
			SELECT 
			  po.id AS option_id,
			  po.option_name,
			  pov.id AS variant_id,
			  pov.name AS variant_name,
			  pov.sku,
			  pov.price,
			  pov.sale_price,
			  pov.sale_start,
			  pov.sale_end,
			  pov.media,
			  pov.created_at,
			  pov.updated_at
			FROM product_options po
			LEFT JOIN product_option_variants pov 
			  ON pov.option_id = po.id AND pov.product_id = po.product_id
			WHERE po.product_id = $1
			ORDER BY po.id, pov.id
			`,
				[id]
			);

			// Build options map
			const optionsMap = {};
			optionsResult.rows.forEach((row) => {
				// Skip if this is a left join with no variants
				if (!row.variant_id) {
					// If no variants yet, still include the option with empty variants array
					if (!optionsMap[row.option_id]) {
						optionsMap[row.option_id] = {
							option_id: row.option_id,
							option_name: row.option_name,
							variants: [],
						};
					}
					return;
				}

				if (!optionsMap[row.option_id]) {
					optionsMap[row.option_id] = {
						option_id: row.option_id,
						option_name: row.option_name,
						variants: [],
					};
				}

				optionsMap[row.option_id].variants.push({
					variant_id: row.variant_id,
					variant_name: row.variant_name,
					sku: row.sku,
					price: row.price,
					sale_price: row.sale_price,
					sale_start: row.sale_start,
					sale_end: row.sale_end,
					media: row.media,
					created_at: row.created_at,
					updated_at: row.updated_at,
				});
			});

			const options = Object.values(optionsMap);

			logger.info(`Retrieved options for product ID ${id}.`);
			res.success({ options }, "Product options retrieved successfully");
		} catch (error) {
			logger.error(
				`Error retrieving options for product ID ${req.params.id}.`,
				{
					error: error.message,
				}
			);
			res.error(`Internal server error: ${error.message}`, 500);
		}
	}
);

/**
 * @route PUT /v1/products/:id/options
 * @description Update all product options and variants for a product in a single operation.
 * @access Protected
 * @param {string} req.params.id - The ID of the product.
 * @param {Object} req.body - The request body.
 * @param {Array} req.body.options - Array of option objects with their variants.
 * @returns {Response} 200 - JSON object containing the updated product with options.
 * @returns {Response} 404 - Not found if the product does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.put(
	"/:id/options",
	validateRequest(productIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { options } = req.body;

			// Add debug logging
			logger.debug("Updating product options", {
				productId: id,
				productIdType: typeof id,
				numericProductId: Number(id),
				options: JSON.stringify(options),
			});

			// Verify the product exists
			const productResult = await query(
				"SELECT id FROM products WHERE id = $1",
				[id]
			);

			if (productResult.rows.length === 0) {
				logger.error(
					`Product with ID ${id} not found for updating options.`
				);
				return res.error("Product not found.", 404);
			}

			// Begin transaction
			await query("BEGIN");

			try {
				// Get existing options for this product
				const existingOptionsResult = await query(
					"SELECT id FROM product_options WHERE product_id = $1",
					[Number(id)]
				);

				const existingOptionIds = existingOptionsResult.rows.map((row) =>
					Number(row.id)
				);
				const providedOptionIds = options
					.filter((o) => o.option_id)
					.map((o) => Number(o.option_id));

				// Find options to delete (those in existingOptionIds but not in providedOptionIds)
				const optionsToDelete = existingOptionIds.filter(
					(id) => !providedOptionIds.includes(id)
				);

				// Delete options that are no longer in the list (this will cascade to delete their variants)
				if (optionsToDelete.length > 0) {
					logger.info(`Deleting product options: ${optionsToDelete.join(', ')}`);
					await query(
						`DELETE FROM product_options WHERE id = ANY($1::bigint[])`,
						[optionsToDelete]
					);
				}

				// Process each option
				for (const option of options) {
					if (option.option_id) {
						// Check if the option exists first
						const productId = Number(id);
						const optionExists = await query(
							"SELECT id FROM product_options WHERE id = $1 AND product_id = $2",
							[option.option_id, productId]
						);

						if (optionExists.rows.length > 0) {
							// Update existing option
							await query(
								"UPDATE product_options SET option_name = $1, updated_at = NOW() WHERE id = $2 AND product_id = $3",
								[
									option.option_name,
									option.option_id,
									productId,
								]
							);
						} else {
							// Option ID was provided but doesn't exist, so insert it with the provided ID
							try {
								await query(
									"INSERT INTO product_options (id, product_id, option_name) VALUES ($1, $2, $3)",
									[
										option.option_id,
										productId,
										option.option_name,
									]
								);
								logger.info(
									`Created new product option with ID ${option.option_id} for product ${productId}`
								);
							} catch (error) {
								logger.error(
									`Failed to insert product option with ID ${option.option_id}`,
									{
										error: error.message,
										productId,
										optionId: option.option_id,
										optionName: option.option_name,
									}
								);
								throw error;
							}
						}
					} else {
						// Create new option with generated ID
						const productId = Number(id);
						const newOptionResult = await query(
							"INSERT INTO product_options (product_id, option_name) VALUES ($1, $2) RETURNING id",
							[productId, option.option_name]
						);
						option.option_id = newOptionResult.rows[0].id;
						logger.info(
							`Created new product option with ID ${option.option_id} for product ${productId}`
						);
					}

					// Process variants for this option
					if (option.variants && Array.isArray(option.variants)) {
						// Get existing variants for this option
						const existingVariantsResult = await query(
							"SELECT id FROM product_option_variants WHERE option_id = $1",
							[Number(option.option_id)]
						);

						const existingVariantIds =
							existingVariantsResult.rows.map((row) =>
								Number(row.id)
							);
						const providedVariantIds = option.variants
							.filter((v) => v.variant_id)
							.map((v) => Number(v.variant_id));

						// Find variants to delete (those in existingVariantIds but not in providedVariantIds)
						const variantsToDelete = existingVariantIds.filter(
							(id) => !providedVariantIds.includes(id)
						);

						// Delete variants that are no longer in the list
						if (variantsToDelete.length > 0) {
							await query(
								`DELETE FROM product_option_variants WHERE id = ANY($1::bigint[])`,
								[variantsToDelete]
							);
						}

						// Update or insert variants
						for (const variant of option.variants) {
							// Convert empty strings to null for date fields
							const sale_start =
								variant.sale_start === ""
									? null
									: variant.sale_start;
							const sale_end =
								variant.sale_end === ""
									? null
									: variant.sale_end;

							// Convert empty string to valid JSON for media field
							const media =
								variant.media === "" ? null : variant.media;

							// Ensure price values are numbers
							const price =
								variant.price !== undefined
									? Number(variant.price)
									: 0;
							const salePrice =
								variant.sale_price !== undefined
									? Number(variant.sale_price)
									: 0;
							// Ensure IDs are treated as numbers
							const variantId = variant.variant_id
								? Number(variant.variant_id)
								: null;
							const optionId = Number(option.option_id);
							const productId = Number(id);

							if (variant.variant_id) {
								// Check if variant exists
								const variantExists = await query(
									"SELECT id FROM product_option_variants WHERE id = $1",
									[variantId]
								);

								if (variantExists.rows.length > 0) {
									// Update existing variant
									await query(
										`UPDATE product_option_variants 
										SET name = $1, sku = $2, price = $3, sale_price = $4, 
										sale_start = $5, sale_end = $6, media = $7, updated_at = NOW()
										WHERE id = $8 AND option_id = $9`,
										[
											variant.variant_name,
											variant.sku,
											price,
											salePrice,
											sale_start,
											sale_end,
											media,
											variantId,
											optionId,
										]
									);
								} else {
									// Variant ID was provided but doesn't exist, so insert it with the provided ID
									try {
										await query(
											`INSERT INTO product_option_variants 
											(id, option_id, product_id, name, sku, price, sale_price, sale_start, sale_end, media)
											VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
											[
												variantId,
												optionId,
												productId,
												variant.variant_name,
												variant.sku,
												price,
												salePrice,
												sale_start,
												sale_end,
												media,
											]
										);
										logger.info(
											`Created new product option variant with ID ${variantId}`
										);
									} catch (error) {
										logger.error(
											`Failed to insert product option variant with ID ${variantId}`,
											{
												error: error.message,
												productId,
												optionId,
												variantId,
												variantName:
													variant.variant_name,
											}
										);
										throw error;
									}
								}
							} else {
								// Create new variant with generated ID
								await query(
									`INSERT INTO product_option_variants 
									(option_id, product_id, name, sku, price, sale_price, sale_start, sale_end, media)
									VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
									[
										optionId,
										productId,
										variant.variant_name,
										variant.sku,
										price,
										salePrice,
										sale_start,
										sale_end,
										media,
									]
								);
							}
						}
					}
				}

				// Commit transaction
				await query("COMMIT");

				logger.info(
					`Product options updated successfully for product ID ${id}.`
				);

				// Fetch updated product with options for response
				// Similar to GET /:id route
				const optionsResult = await query(
					`
				SELECT 
				  po.id AS option_id,
				  po.option_name,
				  pov.id AS variant_id,
				  pov.name AS variant_name,
				  pov.sku,
				  pov.price,
				  pov.sale_price,
				  pov.sale_start,
				  pov.sale_end,
				  pov.media,
				  pov.created_at,
				  pov.updated_at
				FROM product_options po
				LEFT JOIN product_option_variants pov 
				  ON pov.option_id = po.id AND pov.product_id = po.product_id
				WHERE po.product_id = $1
				ORDER BY po.id, pov.id
				`,
					[Number(id)]
				);

				// Build options map like in the GET endpoint
				const optionsMap = {};
				optionsResult.rows.forEach((row) => {
					// Skip if this is a left join with no variants
					if (!row.variant_id) {
						// If no variants yet, still include the option with empty variants array
						if (!optionsMap[row.option_id]) {
							optionsMap[row.option_id] = {
								option_id: row.option_id,
								option_name: row.option_name,
								variants: [],
							};
						}
						return;
					}

					if (!optionsMap[row.option_id]) {
						optionsMap[row.option_id] = {
							option_id: row.option_id,
							option_name: row.option_name,
							variants: [],
						};
					}

					optionsMap[row.option_id].variants.push({
						variant_id: row.variant_id,
						variant_name: row.variant_name,
						sku: row.sku,
						price: row.price,
						sale_price: row.sale_price,
						sale_start: row.sale_start,
						sale_end: row.sale_end,
						media: row.media,
						created_at: row.created_at,
						updated_at: row.updated_at,
					});
				});

				const updatedOptions = Object.values(optionsMap);

				res.success(
					{ options: updatedOptions },
					"Product options updated successfully"
				);
			} catch (error) {
				// Rollback transaction on error
				await query("ROLLBACK");
				throw error;
			}
		} catch (error) {
			logger.error(
				`Error updating options for product ID ${req.params.id}.`,
				{
					error: error.message,
				}
			);
			res.error(`Internal server error: ${error.message}`, 500);
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
			const result = await query(queryText, values);
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
			const result = await query(
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
