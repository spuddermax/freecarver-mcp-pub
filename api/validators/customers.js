import Joi from "joi";

export const createCustomerSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	first_name: Joi.string().optional(),
	last_name: Joi.string().optional(),
	phone_number: Joi.string().optional(),
});

export const updateCustomerSchema = Joi.object({
	email: Joi.string().email().required(),
	first_name: Joi.string().optional(),
	last_name: Joi.string().optional(),
	phone_number: Joi.string().optional(),
});
