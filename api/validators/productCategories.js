import Joi from "joi";

export const createProductCategorySchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().allow(null, "").optional(),
	parent_category_id: Joi.number().optional(),
});

export const updateProductCategorySchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().allow(null, "").optional(),
	parent_category_id: Joi.number().allow(null).optional(),
});

export const productCategoryIdSchema = Joi.object({
	id: Joi.number().required(),
});
