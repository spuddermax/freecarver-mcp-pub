// /api/validators/products.js

import Joi from "joi";

// Schema for listing products (query parameters)
export const productListSchema = Joi.object({
	page: Joi.number().integer().min(1).optional(),
	limit: Joi.number().integer().min(1).optional(),
	orderBy: Joi.string()
		.valid("id", "name", "price", "sale_price", "created_at", "updated_at")
		.optional(),
	order: Joi.string().valid("asc", "desc").optional(),
});

// Schema for creating or updating a product
export const createOrUpdateProductSchema = Joi.object({
	name: Joi.string().min(1).max(255).optional(),
	description: Joi.string().allow("").optional(),
	price: Joi.number().precision(2).optional(),
	sale_price: Joi.number().precision(2).optional(),
	sale_start: Joi.date().iso().optional(),
	sale_end: Joi.date().iso().optional(),
	sku: Joi.string().optional(),
	// product_media can be a JSON string, or an array of objects, etc.
	product_media: Joi.alternatives()
		.try(Joi.string(), Joi.array().items(Joi.object()))
		.optional(),
});

// Schema for validating a product id (URL parameters)
export const productIdSchema = Joi.object({
	id: Joi.number().integer().required(),
});

// Schema for product category assignments
export const productCategoryAssignmentSchema = Joi.object({
	category_ids: Joi.array().items(Joi.number().integer().required()).min(0).required(),
});
