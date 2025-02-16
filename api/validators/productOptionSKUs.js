// /api/validators/productOptionSKUs.js

import Joi from "joi";

export const createProductOptionSKUSchema = Joi.object({
	product_id: Joi.number().required(),
	option_id: Joi.number().required(),
	variant_id: Joi.number().required(),
	sku: Joi.string().required(),
	price: Joi.number().optional(),
	sale_price: Joi.number().optional(),
	sale_start: Joi.string().isoDate().optional(),
	sale_end: Joi.string().isoDate().optional(),
});

export const updateProductOptionSKUSchema = Joi.object({
	product_id: Joi.number().required(),
	option_id: Joi.number().required(),
	variant_id: Joi.number().required(),
	sku: Joi.string().required(),
	price: Joi.number().optional(),
	sale_price: Joi.number().optional(),
	sale_start: Joi.string().isoDate().optional(),
	sale_end: Joi.string().isoDate().optional(),
});

export const productOptionSkuIdSchema = Joi.object({
	id: Joi.number().required(),
});
