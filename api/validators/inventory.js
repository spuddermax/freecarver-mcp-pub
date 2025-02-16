// /api/validators/inventory.js

import Joi from "joi";

export const createInventoryLocationSchema = Joi.object({
	location_identifier: Joi.string().required(),
	description: Joi.string().optional().allow(null, ""),
});

export const updateInventoryLocationSchema = Joi.object({
	location_identifier: Joi.string().required(),
	description: Joi.string().optional().allow(null, ""),
});

export const inventoryLocationIdSchema = Joi.object({
	id: Joi.number().required(),
});

export const createOrUpdateInventoryProductSchema = Joi.object({
	product_id: Joi.number().required(),
	location_id: Joi.number().required(),
	quantity: Joi.number().required(),
});

export const inventoryProductIdSchema = Joi.object({
	id: Joi.number().required(),
});
