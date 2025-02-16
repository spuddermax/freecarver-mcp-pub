// /api/validators/customerAuth.js

import Joi from "joi";

export const customerAuthLoginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});
