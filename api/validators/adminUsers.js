// /api/validators/adminUsers.js

import Joi from "joi";

export const createAdminUserSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	first_name: Joi.string().optional(),
	last_name: Joi.string().optional(),
	phone_number: Joi.string().optional().allow("", null),
	role_id: Joi.number().required(),
	timezone: Joi.string().optional(),
	mfa_enabled: Joi.boolean().optional(),
	mfa_method: Joi.string().optional().allow("", null),
});

export const updateAdminUserSchema = Joi.object({
	email: Joi.string().email().optional(),
	first_name: Joi.string().optional(),
	last_name: Joi.string().optional(),
	phone_number: Joi.string().optional().allow("", null),
	timezone: Joi.string().optional(),
	mfa_enabled: Joi.boolean().optional(),
	mfa_method: Joi.string().optional().allow("", null),
	password: Joi.string().min(6).optional(),
});

export const adminUserIdSchema = Joi.object({
	id: Joi.number().required(),
});
