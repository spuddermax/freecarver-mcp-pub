// /api/validators/productOptions.js

import Joi from "joi";

export const createProductOptionSchema = Joi.object({
	option_name: Joi.string().required(),
});

export const updateProductOptionSchema = Joi.object({
	option_name: Joi.string().required(),
});

export const productOptionIdSchema = Joi.object({
	id: Joi.number().required(),
});
